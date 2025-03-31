<?php include('header.php'); ?>

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

                <!-- Topbar Navbar -->
                <ul class="navbar-nav ml-auto">

                    <div></div>

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

            </div>
            <!-- End Page Content -->

        </div>
        <!-- End of Main Content -->

    </div>
    <!-- End of Content Wrapper -->

</div>
<!-- End of Page Wrapper -->


<?php include('footer.php');?>
