<?php
/***
 * @param $value
 * @return
 *
 * php -f upload_LCDdata_process.php md.csv
 *
 */
//if (session_status() === PHP_SESSION_NONE) { session_start(); }
//echo (dirname(__FILE__) . '/php_include/config.php');
//exit;

function set_query_value($value)
{
    if ($value == NULL || $value == '' || $value == 'NULL')
        return "'NULL'";
    return "'$value'";
}

function ProcessLCDDataFile($LCDDataFile)
{
    require_once(dirname(__FILE__) . '/php_include/config.php');
    require_once(dirname(__FILE__) . '/php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection();

//    Parsing LCD Data
    $open = fopen($LCDDataFile, "r") or die($LCDDataFile . " does not exist!");

    $NewStationIDX = '';
    $NewStationStateCode = '';

    $QueryArray = Array();
    while (($data = fgetcsv($open, 5000, ",")) !== FALSE)
    {
        $Station = '';
        $HourlyPrecipitation = '';

        // Read the data
        $Station = $data[0];   // Station

        if (!isset($data[45])) {
            error_log($LCDDataFile. " no HPCP");
            if (__EMAILNOTIFICATION == true)
            {
                require_once (dirname(__FILE__) . '/php_include/notify_user.php');
                Notify_Admin($LCDDataFile. " no HPCP");
            }
            continue;    // no HPCP
        }

        // first row ...not processing
        if ($Station == 'STATION') continue;

        if ($NewStationIDX == '' && $NewStationStateCode == '') {
            $WBAN_ID = substr($Station, 6);
            $dbConnection->sendQuery("CALL SP_FetchNewStationIDStatebyWBANID('$WBAN_ID')");
            if ($row = $dbConnection->fetchAssoc()) {
                if ($row["IDX"] == '') {
                    // no new station ID found
                    error_log("no new station ID ($WBAN_ID) found");
                    fclose($open);

                    if (__EMAILNOTIFICATION == true)
                    {
                        require_once (dirname(__FILE__) . '/php_include/notify_user.php');
                        Notify_Admin("no new station ID (WBANID: $WBAN_ID) found");
                    }

                    return FALSE;
                }
                $NewStationIDX = $row["IDX"];
                $NewStationStateCode = strtolower($row["ST"]);
            }
        }

        $HourlyPrecipitation = $data[45];
        if ($HourlyPrecipitation != '')
        {
            $Date = $data[1];   // DATE  (2013-01-01T00:14:00)
            $Date = str_replace("T"," ", $Date);
            $Report_Type = $data[2];   // REPORT_TYPE
            $Source = $data[3];   //	SOURCE
            $WBAN_ID = substr($Station, 6);
            // s = suspect value (appears with value)
            // T = trace precipitation amount or snow depth (an amount too small to measure, usually < 0.005 inches water equivalent) (appears instead of numeric value)
            // M = missing value (appears instead of value) Blank = value is unreported (appears instead of value)
            $HPCP_Measurement_Flag = '';
            if (strpos($HourlyPrecipitation, 'T') !== false) {
                $HourlyPrecipitation = 'NULL';
                $HPCP_Measurement_Flag = 'T';
            }
            if (strpos($HourlyPrecipitation, 'M') !== false) {
                $HourlyPrecipitation = 'NULL';
                if ($HPCP_Measurement_Flag != '')
                    $HPCP_Measurement_Flag = $HPCP_Measurement_Flag . 'M';
                else
                    $HPCP_Measurement_Flag = 'M';
            }
            if (strpos($HourlyPrecipitation, 's') !== false) {
                if ($HPCP_Measurement_Flag != '')
                    $HPCP_Measurement_Flag = $HPCP_Measurement_Flag . 's';
                else
                    $HPCP_Measurement_Flag = 's';
                $HourlyPrecipitation = str_replace("s","",$HourlyPrecipitation);
            }

            // Find # of occurrences
            if (substr_count($HourlyPrecipitation,".") >= 2)
            {
                $BeforeHourlyPrecipitation = $HourlyPrecipitation;
                $HourlyPrecipitation = substr($HourlyPrecipitation,4);

//                echo ("HourlyPrecipitation converted <br/><br/>Data: ".$LCDDataFile." ".$NewStationStateCode. " " . $BeforeHourlyPrecipitation . " -> " . $HourlyPrecipitation );

                if (__EMAILNOTIFICATION == true)
                {
                    require_once (dirname(__FILE__) . '/php_include/notify_user.php');
                    Notify_Admin("HourlyPrecipitation converted <br/><br/>Data: ".$LCDDataFile." ".$NewStationStateCode. " " . $BeforeHourlyPrecipitation . " -> " . $HourlyPrecipitation );
                }
            }


            if ($NewStationIDX != '' && $NewStationStateCode != '')
            {
                $QueryTmp = "CALL SP_AddLCDHPCP('$NewStationIDX', '$Date', '$HourlyPrecipitation', '$HPCP_Measurement_Flag', '$Report_Type', '$Source', '$NewStationStateCode', 'hourlyprecipitation_$NewStationStateCode');";

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
        error_log("Error ($LCDDataFile)" . $MultiQuery . PHP_EOL);
        error_log( "Caught exception: " . $e->getMessage() . PHP_EOL);
        exit;
    }

    if (__EMAILNOTIFICATION == true)
    {
        require_once (dirname(__FILE__) . '/php_include/mail_attachment.php');
        NotifyAdminByEmail("Notification: Data Uploading Finished!!", "Data Uploading Finished (File: $LCDDataFile).");
    }

    //sleep for 10 seconds
    sleep(10);

    unlink($LCDDataFile); // remove uploaded file


    return TRUE;
}

if (isset($_SERVER['argv']))
{
    if (count($_SERVER['argv']) == 2) {
        $LCDDataFile = $_SERVER['argv'][1];

        // Process each LCD data file
        ProcessLCDDataFile($LCDDataFile);
    }
}
