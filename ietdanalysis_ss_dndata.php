<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$FromDate = '';
$ToDate = '';
$Station_Idx = '';
$Station_Name = '';
$State = '';
if(isset($_GET['from'])) $FromDate = $_GET['from'];
if(isset($_GET['to'])) $ToDate = $_GET['to'];
if(isset($_GET['station'])) $Station_Idx = $_GET['station'];
if(isset($_GET['name'])) $Station_Name = $_GET['name'];
if(isset($_GET['state'])) $State = strtolower($_GET['state']);
if ($State == '' || $Station_Idx == '' || $Station_Name == '' || $FromDate == '' || $ToDate == '' )
{
    exit;
}

//$FromDate = '2013-02-01';
//$ToDate = '2023-01-01';
//$Station_Idx = '34013';
//$Station_Name = 'ADAK';
//$State = 'AK';

// Fetching hourly precipitation  raw data
require_once('./ietdanalysis_data.php');
$EVENTDATA = fetch_hourly_HPCPdata($FromDate, $ToDate, $Station_Idx, $State);

// Convert data to downloadable format
$data_array = array();
$idx = 0;
foreach ($EVENTDATA as $key => $value)
{
    $FDate = $key;
    $TDate = $EVENTDATA[$key]['EndDate'];
    $HPCP_Volume = round(floatval($EVENTDATA[$key]['HPCP']), 2);

    $data_array[$idx]['BeginDate']  = $FDate;
    $data_array[$idx]['EndDate']  = $TDate;
    $data_array[$idx]['HPCP']  = $HPCP_Volume;

    $idx ++;
}

// Formatting file name
$Station_Name = str_replace("|", "-", $Station_Name);
$FName = strtoupper($State) . "-" . $Station_Name . "-" . $FromDate. "-" . $ToDate .".csv";

require_once('./php_include/listfunc.php');
Array2CSVDownload($data_array, $FName);
