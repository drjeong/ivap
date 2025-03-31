<?php
if (!isset($_SESSION)) { session_start(); }

// allowed only to the users who have admin privileges
if ($_SESSION['LOGIN_PRIVILEGE']&128) {

    $UserIdx = $_GET['id'];
    $Option = trim($_GET['option']);
    $Checked = trim($_GET['checked']);
    if ($UserIdx == '' || $Option == '' || $Checked == '') {
        echo "0x00000011";
        exit;
    }
    $Checked = ($Checked == 'true') ? 1 : 0;


    //--------------------------------- DB PROCESS ------------------------------------------------------
    try {
        require_once('./php_include/dbconnection_class.php');
        $dbConnection = new Dbconnection();

        $SetField = '';
        switch ($Option) {
            case 'SysAdmin':
                $SetField = "`Privilege1`=$Checked";
                break;
            case 'AccessEnabled':
                $SetField = "`Active`=$Checked";
                break;
        }

        if ($SetField != '') {
            $Query = "UPDATE `useraccounts` SET $SetField WHERE `Idx`='$UserIdx';";
//            echo $Query;
            $result = $dbConnection->sendQuery($Query);
        }

        echo "0x11111111";
        return;
    } catch (Exception $e) {
        echo "0x00000000";
    }
}
echo "0x00000000";
