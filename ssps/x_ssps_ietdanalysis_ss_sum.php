<?php
// ssps/ssps_ietdanalysis_ss_sum.php?state=DC&station=2033&ietd=2&from=1948-08-01&to=1965-12-25
//$IETD = 2;
//$FromDate = '1948-08-01';
//$ToDate = '1965-12-25';
//$Station_Idx = '2033';
//$State = 'DC';

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
    echo('{"draw":0,"recordsTotal":0,"recordsFiltered":0,"data":[]}');
    exit;
}

$IETD = $IETD * 60; // convert hour to minutes

require_once('../ietdanalysis_data.php');
$EVENTDATA = fetch_ietd_sumdata($IETD, $FromDate, $ToDate, $Station_Idx, $State);

//print_r($EVENTDATA);

$data_array = array();
$idx = 0;
foreach ($EVENTDATA as $key => $value)
{
    $FDate = $key;
    $TDate = $EVENTDATA[$key]['EndDate'];
    $HPCP_Volume = round(floatval($EVENTDATA[$key]['HPCP']), 2);
    $EventCount = $EVENTDATA[$key]['CNT'];

    $row_array['DT_RowId'] = 'row_'.$idx;
    $row_array['FromDateTime'] = $FDate;
    $row_array['ToDateTime'] = $TDate;
    $row_array['HPCP'] = $HPCP_Volume;
    $row_array['CNT'] = $EventCount;

    array_push($data_array,$row_array);
    unset($row_array);

    $idx ++;
}

$json_data = array(
    "data" => $data_array
);
echo json_encode($json_data);

