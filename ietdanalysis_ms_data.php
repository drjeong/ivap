<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$IETD = '';
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
if ($States == '' || $Stations == '' || $IETD == '' || $FromDate == '' || $ToDate == '' )
{
    exit;
}

$States = explode ("|", $States);
$Stations = explode ("|", $Stations);
$IETD = $IETD * 60; // convert to minutes

require_once('ietdanalysis_data.php');
$ietddata = array();
for ($i = 0; $i < count($States); $i++)
{
    $State = $States[$i];
    $Station = $Stations[$i];

    // Fetching raw HPCP data
    $data = fetch_ietd_sumdata($IETD, $FromDate, $ToDate, $Station, $State);
    $data = convert2hichartformat($data);

    $station_array = array();
    array_push($station_array, $Station);
    array_push($station_array, $data);
    array_push($ietddata, $station_array);

    unset($data);
    unset($station_array);
}

header("content-type: application/json");
$jsoncode = json_encode($ietddata);
$jsoncode = str_replace("\"", "", $jsoncode);

if(isset($_GET['callback']))
    echo $_GET['callback']. '('. $jsoncode . ')';
else
    echo $jsoncode;
