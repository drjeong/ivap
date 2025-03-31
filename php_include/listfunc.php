<?php

/**
 * return DOS OR UNIX
 */
function familyOS() {
    return (stripos(PHP_OS, "WIN") === 0)? "WIN" : "UNIX";
}


//class Event{
//    public $BeginDate = null;
//    public $EndDate = null;
//    public $Value = null;
//    function IsEmpty(){
//        return ($this->BeginDate == null || $this->EndDate == null);
//    }
//    function SetValue($val){
//        $this->Value = $val;
//    }
//    function SetBeginDate($date){
//        $this->BeginDate = $date;
//    }
//    function SetEndDate($date){
//        $this->EndDate = $date;
//    }
//    function GetBeginDateUTCString(){
//        return ('Date.UTC('.ConvertDateToJsFormat($this->BeginDate).')');
//    }
//    function GetEndDateUTCString(){
//        return ('Date.UTC('.ConvertDateToJsFormat($this->EndDate).')');
//    }
//}

function AddItemToDataArray(&$DataArray, $Item, $Value)
{
    $RowArray = array();
    $UTCDate = 'Date.UTC('.ConvertDateToJsFormat($Item).')';
    array_push($RowArray, $UTCDate);
    array_push($RowArray, $Value);
    array_push($DataArray, $RowArray);
}

function GetMinuteDifference(&$Event1, &$Event2)
{
    return (round(abs(strtotime($Event1->BeginDate) - strtotime($Event2->EndDate)) / 60, 2));
}

function formatBytes($bytes, $precision=2)
{
    $unit_list = array
    (
        'B',
        'KB',
        'MB',
        'GB',
        'TB',
    );

    $index_max = count($unit_list) - 1;
    $bytes = max($bytes, 0);

    for ($index = 0; $bytes >= 1024 && $index < $index_max; $index++)
    {
        $bytes /= 1024;
    }

    return round($bytes, $precision) . ' ' . $unit_list[$index];
}

function genRandomString($length = 30) {
    $characters = '0123456789';
    $string = '';    

    for ($p = 0; $p < $length; $p++) {
        $string .= $characters[mt_rand(0, strlen($characters)-1)];
    }

    return $string;
}

function genRandomCharString($length = 10) {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $string = '';    

    for ($p = 0; $p < $length; $p++) {
        $string .= $characters[mt_rand(0, strlen($characters)-1)];
    }

    return $string;
}


function ConvertDateToJsFormat($Date)
{
	$Year = date("Y", strtotime($Date));
	$Month = date("m", strtotime($Date)) - 1;
	$Day = date("d", strtotime($Date));
	$Hour = date("H", strtotime($Date));
	$Minute = date("i", strtotime($Date));

	return ($Year.','.$Month.','.$Day.','.$Hour.','.$Minute);
}

function ConvertDateToJsUTCFormat($Date)
{
	$Year = date("Y", strtotime($Date));
	$Month = date("m", strtotime($Date));
	$Day = date("d", strtotime($Date));
	$Hour = date("H", strtotime($Date));
	$Minute = date("i", strtotime($Date));

	$ts = gmmktime($Hour, $Minute, 0, $Month, $Day, $Year) * 1000;

	return $ts;
}

function GetYearMonthDay($Date)
{
	$Year = date("Y", strtotime($Date));
	$Month = date("m", strtotime($Date));
	$Day = date("d", strtotime($Date));

	return ($Year.','.$Month.','.$Day);
}

/**
 * Array2CSVDownload
 *
 */
function Array2CSVDownload($array, $filename = 'data.csv', $separator = ",")
{
    ob_start();
    $outputCsv = fopen('php://output', 'w');

    $header = False;
    foreach ($array as $hpcp)
    {
        if ($header == False)
        {
            $keys = array_keys($hpcp);
            fputcsv($outputCsv, $keys, $separator);
            $header = True;
        }

        $values = array_values($hpcp);
        fputcsv($outputCsv, $values, $separator);
    }

//    fputcsv($outputCsv, ['column 1', 'column 2','column 3'], $separator);
//    fputcsv($outputCsv, ['value 1', 'value 2', 'value 3'], $separator);
//    fputcsv($outputCsv, ['value 11', 'value 21', 'value 31'], $separator);
//    fputcsv($outputCsv, ['value 12', 'value 22', 'value 31'], $separator);

    header('Cache-Control: max-age=0');
    header("Expires: 0");
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT'); // always modified
    header('Cache-Control: cache, must-revalidate'); // HTTP/1.1
    header('Pragma: public'); // HTTP/1.0
    header("Content-Type: application/force-download");
    header("Content-Type: application/octet-stream");
    header("Content-Type: application/download");
    header('Content-type: application/csv');
    header('Content-Disposition: attachment;filename="'.$filename.'"');
    header("Content-Transfer-Encoding: binary");
    fpassthru($outputCsv);
    fclose($outputCsv);
}