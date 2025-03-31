<?php 
set_time_limit(0);
if (session_status() === PHP_SESSION_NONE) { session_start(); }

function UploadDataProcess($UploadedFileName)
{
	if ($UploadedFileName == '') return;

    include_once ('./php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection; // DB CONNECTION

    $SQL_Stations =  str_replace(".csv", "_stations.sql", $UploadedFileName);
    $SQL_Precipitations =  str_replace(".csv", "_precipitations.sql", $UploadedFileName);

    // data saving
    $SqlCmd = "/var/www/precipitationdataupload/precipitationhourlydataparser $UploadedFileName";
//    error_log($SqlCmd);
    shell_exec($SqlCmd);

    $SqlCmd = "mysql --defaults-extra-file=DB/dbhost.cnf ".$dbConnection->vDbname." < $SQL_Stations";
//    error_log($SqlCmd);
    shell_exec($SqlCmd);

    $SqlCmd = "mysql --defaults-extra-file=DB/dbhost.cnf ".$dbConnection->vDbname." < $SQL_Precipitations";
//    error_log($SqlCmd);
    shell_exec($SqlCmd);

    // Update uploading finished date
    $Query = "UPDATE `Precipitation_HourlyData_Logs` SET `UploadFinishedDate`=NOW() WHERE `UpFileName` = '$UploadedFileName'; ";
    $dbConnection->sendQuery($Query);

    //sleep for 10 seconds
    sleep(10);

    unlink($UploadedFileName); // remove uploaded file
    unlink($SQL_Stations); // remove temporary sql file
    unlink($SQL_Precipitations); // remove temporary sql file

    require_once ('./php_include/mail_attachment.php');
    NotifyAdminByEmail("Notification: Data Uploading Finished!!", "Data Uploading Finished (File: $UploadedFileName).");
}

if(isset($_SERVER['argv'])) 
{
	$fName = $_SERVER['argv'][1];
	//echo ('[['.$fName.']]');
	UploadDataProcess($fName);
}
