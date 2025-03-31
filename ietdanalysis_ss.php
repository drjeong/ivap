<?php
/**
 * Title: Single Station IETD Analysis
 * File: ietdanalysis_ss.php
 * Author: Dong H Jeong
 * Desc: Supporting single station IETD analysis
 * History
 *  - 07/01/2023 Initial version created
 *
 * References
 *
 */

include('header.php');

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
                    <p style="margin-top:0.2in;text-align:center;"><span style="font-size:13pt;font-weight:bold;">Single-station - Inter-Event Time Definition (IETD) Analysis</span>&nbsp;</p>
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


            <!-- Begin Page Content -->
            <div class="container-fluid">
                <?php include_once ('./ietdanalysis_ssc.php'); ?>
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
