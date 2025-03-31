<?php 
//////////////////////////////////////////////////////////////////////////////////////////
// Change Login Information
// File: changelogininfo_save.php
// save changed login information
//
//
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;


if (!isset($_POST['email'])) {
    echo ("0x00000001"); // error
    exit;
}

// processing changed password
$email=$_POST['email'];

require_once('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection();

$OldPWD=$_POST['_OPWD'];
$NewPWD=$_POST['_NPWD'];

$OldPWD_Encrypted = hash('sha256', $OldPWD);
$NewPWD_Encrypted = hash('sha256', $NewPWD);

$Query = "SELECT * FROM `useraccounts` WHERE `email`='$email' AND `PWD`='$OldPWD_Encrypted' ";
$result = $dbConnection->sendQuery($Query);
//		error_log($Query);
if($dbConnection->Fnum_rows() == 0)
{
    echo ("0x00201000"); // Current Password is matched to the stored password!
    exit;
}

$Query = "UPDATE `useraccounts` SET `PWD`='$NewPWD_Encrypted' WHERE `email`='$email'";
//		error_log($Query);
$result = $dbConnection->sendQuery($Query);

if (mysqli_connect_errno())
{
    echo ("0x00001100"); // Error occurred while updating the password!! Please contact the system administrator!!
    exit;
}
echo ("0x11111111"); // Password has been updated successfully!!
