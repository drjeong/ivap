<?php
/**
 * Title: Stations Summary
 * File: stations_summary.php
 * Author: Dong H Jeong
 * Desc: Showing the summary of the data exists in the database system.
 * History
 *  - 07/01/2023 Initial version created
 *
 * Reference:
 * - Submitting form object using async: https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects
 */

include('header.php');
?>

<script src="checkasyncprocess.min.js"></script>
<?php
require_once(dirname(__FILE__) . '/php_include/listfunc.php');
if (familyOS() == 'UNIX') {
    echo("<script>CheckAsyncProcesses();</script>");
}
?>

<!-- Begin Page Wrapper -->
<div id="wrapper">

    <?php include('sidebar.php'); ?>

    <!-- Begin Content Wrapper -->
    <div id="content-wrapper" class="d-flex flex-column">

        <!-- Begin Main Content -->
        <div id="content">
            <!-- Topbar -->
            <nav class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                <!-- Sidebar Toggle (Topbar) -->
                <button id="sidebarToggleTop" class="btn btn-link d-md-none rounded-circle mr-3">
                    <i class="fa fa-bars"></i>
                </button>

                <div>
                    <p style="margin-top:0.2in;text-align:center;"><span style="font-size:13pt;font-weight:bold;">Listing of Stations Data Availability</span>&nbsp;</p>
                </div>

                <!-- Topbar Navbar -->
                <ul class="navbar-nav ml-auto">
                    <div class="topbar-divider d-none d-sm-block"></div>
                    <?php
                    if ($_SESSION['SYSTEM_ENVIRONMENT'] !== Config::ENV_PHP_DESKTOP)
                        include('userinfo.php');
                    ?>
                </ul>

            </nav>
            <!-- End of Topbar -->

            <script src="./js/ol.js"></script>
            <script src="./js/hichart.js"></script>

            <!-- Begin Page Content -->
            <div class="container-fluid">
                <!-- Page Heading -->
                <div class="d-sm-flex align-items-center justify-content-between mb-4">
                    <div class="text-base font-weight-bold text-primary text-uppercase">DATA</div>
                    <!--    <a href="#" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">-->
                    <!--        <i class="fas fa-download fa-sm text-white-50"></i> Generate Report-->
                    <!--    </a>-->
                </div>

                <div class="row" style="visibility:hidden;display:none;width:100%;height:30px" id="data_uploading_notice">
                    <p><span class="blink" style="font-size:12pt;font-weight:bold;color:red">DATA UPLOADING IS IN PROGRESS....</span></p>
                </div>

                <!-- Content Row -->
                <div class="row">
                    <?php include('stations_summary_c.php'); ?>
                </div>
            </div>
            <!-- End Page Content -->

        </div>
        <!-- End of Main Content -->

    </div>
    <!-- End of Content Wrapper -->
    <div class="loadingspinnermodal"><!-- Place at bottom of page --></div>

</div>
<!-- End of Page Wrapper -->

<?php include('footer.php');?>

