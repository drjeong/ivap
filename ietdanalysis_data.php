<?php
//state=DC&station=&ietd=1&from=&to=
//fetch_hourly_HPCPdata('1948-08-01', '1965-12-25', 2033, 'DC' );

function fetch_station_name($Station_Idx)
{
    $Station_Name = '';
    require_once(dirname(__FILE__) . '/php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection;

    $Query = "SELECT `NAME` FROM `newweatherstations` WHERE `IDX`=?";

    $result = $dbConnection->prepareExecute($Query, [$Station_Idx], false);
//echo ($Query. ' '. $Station_Idx) . PHP_EOL;
    if ($result && is_array($result)) {
        foreach ($result as $row)
            $Station_Name = $row["NAME"];
    }

    return $Station_Name;
}

function fetch_hourly_HPCPdata($FromDate, $ToDate, $Station_Idx, $State)
{
    require_once(dirname(__FILE__).'/php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection;

    $State = strtolower($State);

    $Query = "SELECT `Date`, `HPCP` FROM `hourlyprecipitation_$State` 
                  WHERE `Station`=? AND `HPCP` > 0 AND `HPCP` IS NOT NULL 
                  AND DATE(`Date`)>=? AND DATE(`Date`)<=? ORDER BY `Date`";

//echo ($Query . "$Station_Idx, $FromDate, $ToDate") . PHP_EOL;

    $result = $dbConnection->prepareExecute($Query, [$Station_Idx, $FromDate, $ToDate], false);
    $obj = [];
    if ($result && is_array($result)) {
        foreach ($result as $row) {
            $obj[] = $row;  // Add each row to the result array
        }
    }

    $EVENTDATA = [];
    $date = new DateTime();

    $hourly_HPCP = array();
    $Event_BeginDate = null;
    $Event_EndDate = null;
    if ($result && is_array($result)) {
        foreach ($result as $row) {

            $HPCP = $row["HPCP"];
            $Current_Date = date($row["Date"]);

            $Date_End = date("Y-m-d H:00:00", strtotime($row["Date"]));
            $Date_Begin = date("Y-m-d H:i:00", strtotime("-1 hour", strtotime($Date_End)));

            $date_time_obj = new DateTime($Current_Date);
            if ($date_time_obj->format('i') > 0) {
                // if hour is not zero, it indicates the precipitation collected for the following hour.
                $Date_Begin = date('Y-m-d H:i:s', strtotime($Date_Begin . ' + 1 hours'));
                $Date_End = date('Y-m-d H:i:s', strtotime($Date_End . ' + 1 hours'));
            }

            if (!isset($EVENTDATA[$Date_Begin])) {
                $EVENTDATA[$Date_Begin]['EndDate'] = $Date_End;
                $EVENTDATA[$Date_Begin]['HPCP'] = $HPCP;
                $EVENTDATA[$Date_Begin]['CNT'] = 1;
            } else {
                $EVENTDATA[$Date_Begin]['HPCP'] += $HPCP;
                $EVENTDATA[$Date_Begin]['CNT']++;
            }
        }
    }

    return ($EVENTDATA);
}


function fetch_ietd_sumdata($IETD, $FromDate, $ToDate, $Station_Idx, $State)
{
    $HourlyHPCPData = fetch_hourly_HPCPdata($FromDate, $ToDate, $Station_Idx, $State);

    $EVENTDATA = array();

    $Event_BeginDate = null;
    $Event_EndDate = null;
    foreach ($HourlyHPCPData as $key => $data)
    {
        $Date_Begin = $key;
        $Date_End = $data['EndDate'];
        $HPCP = $data['HPCP'];

//echo ($Date_Begin.' ~ '.$Date_End.' || '.$HPCP.'<br/>');

        if ($Event_BeginDate == null)
        {
            $Event_BeginDate = $Date_Begin;
            $Event_EndDate = $Date_End;
            $EVENTDATA[$Event_BeginDate]['EndDate'] = $Date_End;
            $EVENTDATA[$Event_BeginDate]['HPCP'] = $HPCP;
            $EVENTDATA[$Event_BeginDate]['CNT'] = 1;
        }
        else
        {
//echo (']]]]'.round(abs(strtotime($Date_Begin) - strtotime($Event_EndDate)) / 60, 2).' <= '.$IETD.'<br/>');

            if (round(abs(strtotime($Date_Begin) - strtotime($Event_EndDate)) / 60, 2) <= $IETD)
            { // considered the same event
                $Event_EndDate = $Date_End;
                $EVENTDATA[$Event_BeginDate]['EndDate'] = $Date_End;
                $EVENTDATA[$Event_BeginDate]['HPCP'] += $HPCP;
                $EVENTDATA[$Event_BeginDate]['CNT']++;
//echo ('1--->'.$Event_BeginDate.' ~ '.$EVENTDATA[$Event_BeginDate]['EndDate'].' || '.$EVENTDATA[$Event_BeginDate]['HPCP'].'<br/>');
//						$Event_BeginDate = null;
            }
            else
            {
                // not a part of the previous event
                $Event_BeginDate = $Date_Begin;
                $Event_EndDate = $Date_End;
                $EVENTDATA[$Event_BeginDate]['EndDate'] = $Date_End;
                $EVENTDATA[$Event_BeginDate]['HPCP'] = $HPCP;
                $EVENTDATA[$Event_BeginDate]['CNT'] = 1;
//echo ('2--->'.$Event_BeginDate.' ~ '.$EVENTDATA[$Event_BeginDate]['EndDate'].' || '.$EVENTDATA[$Event_BeginDate]['HPCP'].'<br/>');
            }
        }
//				echo ('<br>');
//				print_r ($EVENTDATA);
//				echo ('<br><br>-------------------------------<br>');
    }

    return ($EVENTDATA);
}

function convert2hichartformat($data)
{
// Convert data to chart format
    require_once('./php_include/listfunc.php'); // for using ConvertDateToJsUTCFormat()
    $data_array = array();
    foreach ($data as $key => $value)
    {
        $FDate = $key;
        $TDate = $data[$key]['EndDate'];
        $HPCP_Volume = round(floatval($data[$key]['HPCP']), 2);
        $EventCount = $data[$key]['CNT'];

        $row_array = array();
        array_push($row_array, ConvertDateToJsUTCFormat($FDate));
        array_push($row_array, ConvertDateToJsUTCFormat($TDate));
        array_push($row_array, $HPCP_Volume);
        array_push($row_array, intval($EventCount));
        array_push($data_array, $row_array);
        unset($row_array);
    }

    return ($data_array);
}