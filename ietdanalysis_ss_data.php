<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$IETD = '';
$FromDate = '';
$ToDate = '';
$Station_Idx = '';
$State = '';
if(isset($_GET['ietd'])) $IETD = $_GET['ietd'];
if(isset($_GET['from'])) $FromDate = $_GET['from'];
if(isset($_GET['to'])) $ToDate = $_GET['to'];
if(isset($_GET['station'])) $Station_Idx = $_GET['station'];
if(isset($_GET['state'])) $State = strtolower($_GET['state']);
if ($State == '' || $Station_Idx == '' || $IETD == '' || $FromDate == '' || $ToDate == '' )
{
    echo "0x00000001";
    exit;
}

// Fetching raw HPCP data
require_once('./ietdanalysis_data.php');
$EVENTDATA = fetch_hourly_HPCPdata($FromDate, $ToDate, $Station_Idx, $State);

require_once('./php_include/listfunc.php');
// Convert data to chart format
$data_array = array();
$idx = 0;
foreach ($EVENTDATA as $key => $value)
{
    $FDate = $key;
    $TDate = $EVENTDATA[$key]['EndDate'];
    $HPCP_Volume = round(floatval($EVENTDATA[$key]['HPCP']), 2);
    $EventCount = $EVENTDATA[$key]['CNT'];

    $row_array = array();
    array_push($row_array, ConvertDateToJsUTCFormat($FDate));
    array_push($row_array, ConvertDateToJsUTCFormat($TDate));
    array_push($row_array, $HPCP_Volume);
    array_push($row_array, intval($EventCount));
    array_push($data_array, $row_array);
    unset($row_array);

    $idx ++;
}
header("content-type: application/json");
$jsoncode = json_encode($data_array);
$jsoncode = str_replace("\"", "", $jsoncode);

if(isset($_GET['callback']))
    echo $_GET['callback']. '('. $jsoncode . ')';
else
    echo $jsoncode;

