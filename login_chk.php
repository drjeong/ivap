<?php
session_unset();
session_start();

require_once (dirname(__FILE__) . '/php_include/config.php');

if ($_SESSION['SYSTEM_ENVIRONMENT'] == Config::ENV_PHP_DESKTOP) {

    $_SESSION['IETD_USERIDX']='Test User';
    $_SESSION['IETD_USERNAME']='Test User';
    $_SESSION['IETD_TIMEOUT'] = (1 * 60 * 60) ; // hour; min; sec = totalseconds
    $Privilege = "11111111";
    $_SESSION['LOGIN_PRIVILEGE']=bindec($Privilege); // convert Privilege to digit number

    header("Location: main.php");
}
else {

    if (!isset($_POST['email']) && !isset($_POST['pwd']))
    {
        include_once ('./php_include/notify_user.php');
        Notify_User_Then_HistoryBack("Login Error!", "Illegal entry!!", "index.php");
        exit;
    }

// username and password sent from the index page
    if (array_key_exists('pwd', $_POST) && array_key_exists('email', $_POST) )
    {
        $PWD=trim($_POST['pwd']);
        $EMAIL=strtolower(trim($_POST['email']));
    }
    else{
        // unwanted illegal entry
        echo "0x00000000";
        exit;
    }

// username and password sent from form
    $PWD=trim($_POST['pwd']);
    $EmailAddress=trim($_POST['email']);
    $PWD_Encrypted = hash('sha256', $PWD);

    include_once ('./php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection;

    $sql="SELECT `Idx`, `Name`, `Privilege1`, `Privilege2`, `Privilege3`, `Privilege4`, `Privilege5`, 
       `Privilege6`, `Privilege7`, `Privilege8`, `active`  FROM `useraccounts` WHERE `PWD`='$PWD_Encrypted' and `Email`='$EmailAddress'";
    $dbConnection->sendQuery($sql);
//echo $sql;

    $UserIdx="";
    $UserName="";
    $Active="";
    if ($row=$dbConnection->fetchAssoc())
    {
        $UserIdx = $row["Idx"];
        $UserName = $row["Name"];
        $Active = $row["active"];
    } else {
        echo("0x61001010");
        unset($dbConnection);
        exit;
    }

    if ($Active == 0) { // waiting for approval
        echo("0x31031010");
        exit;
    }
    if ($Active == 2) { // disabled account
        echo("0x21031010");
        exit;
    }

    $_SESSION['IETD_USERIDX']=$UserIdx;
    $_SESSION['IETD_USERNAME']=$UserName;
    $_SESSION['IETD_TIMEOUT'] = (1 * 60 * 60) ; // hour; min; sec = totalseconds
    $Privilege = $row["Privilege1"].$row["Privilege2"].$row["Privilege3"].$row["Privilege4"].$row["Privilege5"].$row["Privilege6"].$row["Privilege7"].$row["Privilege8"];
    $_SESSION['LOGIN_PRIVILEGE']=bindec($Privilege); // convert Privilege to digit number

// Privilege1 - 128	- System Administration
// Privilege2 - 64	-
// Privilege3 - 32	-
// Privilege4 - 16	-
// Privilege5 - 8	-
// Privilege6 - 4
// Privilege7 - 2
// Privilege8 - 1

    unset($dbConnection);

    echo ("0x11111111");
}

