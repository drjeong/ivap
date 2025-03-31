<?php


function GetStateArrayData()
{
    $state_array= array();
    include_once ('./php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection;

    $sql="SELECT DISTINCT(`ST`) FROM `newweatherstations` WHERE `ST` IS NOT NULL ORDER BY `ST`";
    $dbConnection->sendQuery($sql);
    while ($row = $dbConnection->fetchAssoc())
    {
        $state=$row["ST"];
        $state_array[] = $state;
    }
    unset($dbConnection);

    return $state_array;
}

function GetStationArrayData($State)
{
    $station_array= array();
    if ($State == '')
        return $station_array;

        include_once ('./php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection;

    $sql="SELECT `IDX`, `NCDC_ID`, `COOP_ID`, `NAME`  FROM `newweatherstations` WHERE `ST`='$State' ORDER BY `ST`, `NAME`";
    $dbConnection->sendQuery($sql);
//echo $sql;
    if ($dbConnection->Fnum_rows() > 0)
    {
        $station_idx_array[] = '';
        $station_array[] = '[Select Station]';
        while($row = $dbConnection->fetchAssoc())
        {
            $IDX = $row["IDX"];
            $station = $row["Name"];
            $station_array[$IDX] = $station;
        }
    }
    unset($dbConnection);
    return $station_array;
}