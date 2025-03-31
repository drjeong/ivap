<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$FromDate = '';
$ToDate = '';
$States = '';
$Stations = '';
if(isset($_GET['ietd'])) $IETD = $_GET['ietd'];
if(isset($_GET['from'])) $FromDate = $_GET['from'];
if(isset($_GET['to'])) $ToDate = $_GET['to'];
if(isset($_GET['station'])) $Station_Idx = $_GET['station'];
if(isset($_GET['states'])) $States = $_GET['states'];
if(isset($_GET['stations'])) $Stations = $_GET['stations'];
if ($States == '' || $Stations == '' || $FromDate == '' || $ToDate == '' )
{
    exit;
}

$States = explode ("|", $States);
$Stations = explode ("|", $Stations);

require_once('ietdanalysis_data.php');
$data_array = array();
$idx = 0;
for ($i = 0; $i < count($States); $i++)
{
    $State = $States[$i];
    $Station_Idx = $Stations[$i];

    $station_info = $State . ":" . fetch_station_name($Station_Idx);

    // Fetching raw HPCP data
    $hourlydata = fetch_hourly_HPCPdata($FromDate, $ToDate, $Station_Idx, $State);

    foreach ($hourlydata as $Date_Begin => $data)
    {
        $data_array[$idx]['Station']  = $station_info;
        $data_array[$idx]['BeginDate']  = $Date_Begin;
        $data_array[$idx]['EndDate']  = $data['EndDate'];
        $data_array[$idx]['HPCP']  = $data['HPCP'];
        $idx ++;
    }
}
//exit;

//
//// Fetching HPCP raw data
//require_once('./ietdanalysis_data.php');
//$EVENTDATA = fetch_hourly_HPCPdata($FromDate, $ToDate, $Station_Idx, $State);
//
//// Convert data to downloadable format
//$data_array = array();
//$idx = 0;
//foreach ($EVENTDATA as $key => $value)
//{
//    $FDate = $key;
//    $TDate = $EVENTDATA[$key]['EndDate'];
//    $HPCP_Volume = round(floatval($EVENTDATA[$key]['HPCP']), 2);
//
//    $data_array[$idx]['BeginDate']  = $FDate;
//    $data_array[$idx]['EndDate']  = $TDate;
//    $data_array[$idx]['HPCP']  = $HPCP_Volume;
//
//    $idx ++;
//}
//

// Formatting file name
$FName='MSIETD_'.date('Y-m-d').'.csv';

require_once('./php_include/listfunc.php');
Array2CSVDownload($data_array, $FName);
