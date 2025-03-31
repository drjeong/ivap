<?php
// Remove the following in production.
// At the start of your main PHP file
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

session_start();

require_once (dirname(__FILE__) . '/php_include/config.php');
if ($_SESSION['SYSTEM_ENVIRONMENT'] == Config::ENV_PHP_DESKTOP && !isset($_SESSION['IETD_USERIDX'])) {
    header("Location: login_chk.php");
}

if ($_SESSION['SYSTEM_ENVIRONMENT'] != Config::ENV_PHP_DESKTOP) {
    require_once('sessionchecker.php');
}

?>

<!doctype html>

<html lang="en">
<head>
  <title>IETD PRECIPITATION ANALYSIS</title>
  <meta charset="utf-8">
  <meta name="Author" content="">
  <meta name="Keywords" content="">
  <meta name="Description" content="">
 </head>

 <!-- CSS dependencies -->
<link rel="stylesheet" type="text/css" href="./toolbox/bootstrap-5.3.0-dist/css/bootstrap.min.css">
<link rel="stylesheet" type="text/css" href="./toolbox/jquery-ui-1.11.4.custom/jquery-ui.min.css" />
<link rel="stylesheet" type="text/css" href="./css/style-home.css" />
<link rel="stylesheet" type="text/css" href="./css/datepickr.css" />
<link rel="stylesheet" type="text/css" href="./css/password.css" />
<link rel="stylesheet" type="text/css" href="./css/table.css" />

<link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.12/dist/sweetalert2.min.css" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="./toolbox/DataTables/datatables.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v7.4.0/ol.css">
<link rel="stylesheet" type="text/css" href="./toolbox/sb-admin/sb-admin-2.css">
<link rel="stylesheet" type="text/css" href="./toolbox/fontawesome-free/css/all.min.css">
<link href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

<!-- JS dependencies -->

<?php
if ($_SESSION['SYSTEM_ENVIRONMENT'] != Config::ENV_PHP_DESKTOP) {
echo '<script src="./js/sessionexpire.js"></script>';
}
?>

<script src="toolbox/jquery-3.6/jquery.min.js"></script>
<script src="toolbox/jquery-ui-1.11.4.custom/jquery-ui.min.js"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/5.5.2/bootbox.min.js"></script>
<script src="https://d3js.org/d3.v6.min.js"></script>

<!-- Popperjs -->
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js" integrity="sha256-BRqBN7dYgABqtY9Hd4ynE+1slnEw+roEPFzQ7TRRfcg=" crossorigin="anonymous"></script>

<script src="./toolbox/moment.js"></script>
<script src="./toolbox/bootstrap-5.3.0-dist/js/bootstrap.min.js"></script>
<script src="./toolbox/sweetalert2-11.16.1/package/dist/sweetalert2.min.js"></script>
<script src="./toolbox/DataTables/datatables.min.js"></script>

<!-- HighChart -->
<script src="./toolbox/Highcharts-12.0.2/code/highcharts.js"></script>
<script src="./toolbox/Highcharts-12.0.2/code/modules/data.js"></script>
<script src="./toolbox/Highcharts-12.0.2/code/modules/drag-panes.js"></script>
<script src="./toolbox/Highcharts-12.0.2/code/modules/mouse-wheel-zoom.js"></script>
<script src="./toolbox/Highcharts-12.0.2/code/modules/exporting.js"></script>
<script src="./toolbox/Highcharts-12.0.2/code/modules/accessibility.js"></script>
<script src="./toolbox/Highcharts-12.0.2/code/themes/high-contrast-light.js"></script>

<!-- HighChart -->
<script src="https://cdn.jsdelivr.net/npm/ol@v7.4.0/dist/ol.js"></script>

<!-- Tempus Dominus -->
<link rel="stylesheet" href="./toolbox/tempus-dominus-6.7.10/css/tempus-dominus.min.css">
<script src="toolbox/tempus-dominus-6.7.10/js/tempus-dominus.js" crossorigin="anonymous"></script>
<script src="toolbox/tempus-dominus-6.7.10/js/jQuery-provider.js" crossorigin="anonymous"></script>



<body id="page-top">
