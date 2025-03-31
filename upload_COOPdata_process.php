<?php
/***
 * @param $value
 * @return
 *
 * php -f upload_COOPdata_process.php md.csv
 *
 */

function set_query_value($value)
{
    if ($value == NULL || $value == '' || $value == 'NULL')
        return "'NULL'";
    return "'$value'";
}

function ProcessCOOPDataFile($COOPDataFile)
{
    require_once (dirname(__FILE__) . '/php_include/config.php');
    require_once (dirname(__FILE__) . '/php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection();

//    Parsing COOP Data
    $open = fopen($COOPDataFile, "r") or die($COOPDataFile . " does not exist!");

    $NewStationIDX = '';
    $NewStationStateCode = '';

    $QueryArray = Array();
    while (($data = fgetcsv($open, 1000, ",")) !== FALSE)
    {
        $Station = '';
        $HourlyPrecipitation = '';

        // Read the data
        $Station = $data[0];   // Station

        if (!isset($data[3])) {
            error_log($COOPDataFile. " no HPCP");
            if (__EMAILNOTIFICATION == true)
            {
                require_once (dirname(__FILE__) . '/php_include/notify_user.php');
                Notify_Admin($COOPDataFile. " no HPCP");
            }
            continue;    // no HPCP
        }

        // first row ...not processing
        if ($Station == 'STATION') continue;

        if ($NewStationIDX == '' && $NewStationStateCode == '') {
            $COOP_ID = str_replace("COOP:", "", $Station);

            $dbConnection->sendQuery("CALL SP_FetchNewStationIDStatebyCOOPID('$COOP_ID')");
            if ($row = $dbConnection->fetchAssoc()) {
                if ($row["IDX"] == '') {
                    // no new station ID found
                    error_log("no new station ID ($COOP_ID) found");
                    fclose($open);

                    if (__EMAILNOTIFICATION == true)
                    {
                        require_once (dirname(__FILE__) . '/php_include/notify_user.php');
                        Notify_Admin("no new station ID (COOPID: $COOP_ID) found");
                    }

                    return FALSE;
                }
                $NewStationIDX = $row["IDX"];
                $NewStationStateCode = strtolower($row["ST"]);
            }
        }

        $HourlyPrecipitation = $data[3];
        if ($HourlyPrecipitation != '' && $HourlyPrecipitation != '0.0' && $HourlyPrecipitation != '999.99')
        {
            $COOP_ID = $data[0];
            $COOP_ID = str_replace("COOP:", "", $COOP_ID);
            $StatioName = $data[1];
            $DateTime = explode(" ", $data[2]);   // DATE  (19940101 01:00)

            $Date = substr($DateTime[0], 0, 4) . '-' . substr($DateTime[0], 4, 2) . '-' . substr($DateTime[0], 6, 2);
            $Time = substr($DateTime[1], 0, 2) . ':' . substr($DateTime[1], 3, 2) . ':00';
            $DateTime = $Date . ' ' . $Time;

            if ($NewStationIDX != '' && $NewStationStateCode != '')
            {
                $QueryTmp = "CALL SP_AddCOOPHPCP('$NewStationIDX', '$DateTime', '$HourlyPrecipitation', '$NewStationStateCode', 'hourlyprecipitation_$NewStationStateCode');";
//            echo ($QueryTmp);
                $QueryArray[] = $QueryTmp;
            }
        }
    }
    fclose($open);

    $MultiQuery = '';
    //--------------------------------- DB PROCESS ------------------------------------------------------
    try {

        for ($i = 0; $i < count($QueryArray); $i++) {
            $query = $QueryArray[$i];

            if ($i > 0 && $i % 100 == 0) {
//                echo $MultiQuery . PHP_EOL;
                $dbConnection->sendMultiqueries($MultiQuery);
                $MultiQuery = '';
            }
            $MultiQuery = $MultiQuery . $query;
        }

        if ($MultiQuery != '') {
//            echo $MultiQuery . PHP_EOL;
            $dbConnection->sendMultiqueries($MultiQuery);
        }

        // remove duplicate entries & update summary
        $MultiQuery = "CALL SP_RemoveDuplicatesInHPCPDatabyStation($NewStationIDX, '$NewStationStateCode');";
        $MultiQuery = $MultiQuery . "CALL SP_UpdateHPCPDataSummarybyStation($NewStationIDX, '$NewStationStateCode');";
        $dbConnection->sendMultiqueries($MultiQuery);

    } catch (Exception $e) {
        error_log("Error ($COOPDataFile)" . $MultiQuery . PHP_EOL);
        error_log("Caught exception: " . $e->getMessage() . PHP_EOL);
        exit;
    }

    if (__EMAILNOTIFICATION == true)
    {
        require_once (dirname(__FILE__) . '/php_include/mail_attachment.php');
        NotifyAdminByEmail("Notification: Data Uploading Finished!!", "Data Uploading Finished (File: $COOPDataFile).");
    }

    //sleep for 10 seconds
    sleep(10);

    unlink($COOPDataFile); // remove uploaded file

    return TRUE;
}

if (isset($_SERVER['argv']))
{
    if (count($_SERVER['argv']) == 2) {
        $COOPDataFile = $_SERVER['argv'][1];

        // Process each COOP data file
        ProcessCOOPDataFile($COOPDataFile);
    }
}
