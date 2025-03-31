<?php 
require_once('sessionchecker.php');

if(!isset($_POST) || $_SERVER['REQUEST_METHOD'] != "POST") {
    echo("0x00103023"); // error
    exit;
}

$tot_files = count($_FILES['uploadFiles']['name']);

// Check if the directory is writable
require_once ("./php_include/config.php");
$target_dir = __DIRECTORY_UPLOAD__;
if (!is_writable($target_dir)) {
    error_log("the folder (".$target_dir.") is not writable!!");
    echo ("0x3000203"); // the folder is not writable
    exit;
}

if ($tot_files > 0)
{
    require_once ('./php_include/dbconnection_class.php');
    $dbConnection = new Dbconnection; // DB CONNECTION

    $incorrect_file_count = 0;
    // Loop $_FILES to execute all files
    foreach ($_FILES['uploadFiles']['name'] as $f => $name)
    {
        if ($_FILES['uploadFiles']['error'][$f] == 4)
        {
            continue; // Skip file if any error found
        }
        if ($_FILES['uploadFiles']['error'][$f] == 0)
        { // no error - start loading data
            $FileName = $_FILES["uploadFiles"]["name"][$f];
            $basename = $_SESSION['IETD_USERIDX'].'_'.time().'_'.basename($FileName);
            $UploadedFileName = $target_dir . $basename;

            // Check if file already exists
            //if (file_exists($UploadedFileName . $_FILES["uploadFiles"]["name"])) {
            //    echo "Sorry, file already exists.";
            //	exit;
            //}

            // perform uploading
            if(is_uploaded_file($_FILES['uploadFiles']['tmp_name'][$f])){
                if (!move_uploaded_file($_FILES["uploadFiles"]["tmp_name"][$f], $UploadedFileName)) {
                    error_log("Error _ File Uploading Failed!!");
                    echo ("0x3010203"); // file uploading failed
                    exit;
                }
            }

            // check if the data file has 10 (old format) or 14 (new format) data fields
            // the old format does not capture QGAG
            // data parsing
            if (($fpUpload = fopen($UploadedFileName, "r")) == FALSE) {
                // file not found
                error_log("File ($UploadedFileName) cannot be found.");
                echo ("0x3030203");
                exit;
            }

            // determine dataset format - LCD or COOP
            $datatype = DetermineDataFormat($fpUpload);
            if ($datatype < 0)
            {
                if (__EMAILNOTIFICATION == true)
                {
                    require_once ('./php_include/mail_attachment.php');
                    NotifyAdminByEmail("Notification: Data Uploading Error!!", "Data format Error (File: $UploadedFileName).");
                }
                $incorrect_file_count++;
                continue;
            }

            // getting # of lines in the file
            $totalLines = intval(exec("wc -l '$UploadedFileName'"));
            $query = "INSERT INTO `dataupload_logs`(`User`, `FileName`, `UpFileName`, `NumOfLines`) VALUES ('".$_SESSION['IETD_USERIDX']."', '$FileName', '$UploadedFileName', $totalLines);";
            //echo "</br>".$query."</br>";
            $dbConnection->sendQuery($query);

            switch ($datatype)
            {
                case 1: // COOP dataset
                    if (__BACKGROUND_UPLOADEDDATAPROCESSING == true) {
                        $argument = escapeshellarg($UploadedFileName);
                        error_log("php -f upload_COOPdata_process.php $argument");
//                        shell_exec("php -f upload_COOPdata_process.php $argument \1>/dev/null \2>/dev/null &");
                        exec("php -f upload_COOPdata_process.php $argument" . " > /dev/null &");
                    } else {
                        require_once ('upload_COOPdata_process.php');
                        ProcessCOOPDataFile($UploadedFileName);
                    }
                    break;
                case 2: // LCD dataset
                    if (__BACKGROUND_UPLOADEDDATAPROCESSING == true) {
                        $argument = escapeshellarg($UploadedFileName);
                        error_log("php -f upload_LCDdata_process.php $argument");
//                        shell_exec("php -f upload_LCDdata_process.php $argument \1>/dev/null \2>/dev/null &");
                        exec("php -f upload_LCDdata_process.php $argument" . " > /dev/null &");

                    } else {
                        require_once ('upload_LCDdata_process.php');
                        ProcessLCDDataFile($UploadedFileName);
                    }
                    break;
            }
        }
    }
    if ($incorrect_file_count > 0) {
        echo ("0x3030204"); // some data files not correct format
        exit;
    }

    // upload success
    echo ("0x11111111");
}


function  DetermineDataFormat($fpUpload)
{
    if (($data = fgetcsv($fpUpload, 5000, ",")) !== FALSE) {
        $NumFields = count($data);

        if ($data[0] == "STATION" &&
            $data[1] == "STATION_NAME" &&
            $data[2] == "DATE" &&
            $data[3] == "HPCP")
        {   // COOP dataset
//            echo "COOP dataset";
            return 1; // COOP dataset
        }
        else if ($data[0] == "STATION" &&
            $data[1] == "DATE" &&
            $data[2] == "REPORT_TYPE" &&
            $data[3] == "SOURCE" &&
            $data[45] == "HourlyPrecipitation")
        {   // LCD dataset
//            echo "LCD dataset";
            return 2; // LCD dataset
        }
    }
    return -1;
}
