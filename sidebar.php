
<!-- Sidebar -->
<ul class="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

    <!-- Sidebar - Brand -->
    <a class="sidebar-brand d-flex align-items-center justify-content-center" href="">
        <div class="sidebar-brand-icon rotate-n-15">
            <i class="fas fa-umbrella fa-lg"></i>
        </div>
        <div class="sidebar-brand-text mx-3">IETD Analysis</div>
    </a>

    <!-- Divider -->
    <hr class="sidebar-divider my-0">

    <!-- Heading -->
    <div class="sidebar-heading">
        <span style="color:orange">IETD Analysis</span>
    </div>

    <!-- Nav Item -->
    <li class="nav-item <?php if(basename($_SERVER["SCRIPT_FILENAME"], '.php')=='ietdanalysis_ss') echo('active');?>">
        <a class="nav-link" href="ietdanalysis_ss.php">
            <i class="fas fa-fw fa-chart-area"></i>
            <span>Single-station</span></a>
    </li>

    <!-- Nav Item -->
    <li class="nav-item <?php if(basename($_SERVER["SCRIPT_FILENAME"], '.php')=='ietdanalysis_ms') echo('active');?>">
        <a class="nav-link" href="ietdanalysis_ms.php">
            <i class="fas fa-fw fa-chart-bar"></i>
            <span>Multi-stations</span></a>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider">

    <!-- Heading -->
    <div class="sidebar-heading">
        Data
    </div>

    <!-- Nav Item -->
    <li class="nav-item <?php if(basename($_SERVER["SCRIPT_FILENAME"], '.php')=='stations') echo('active');?>">
        <a class="nav-link" href="stations.php">
            <i class="fas fa-warehouse"></i>
            <span>Stations</span></a>
    </li>

    <!-- Nav Item -->
    <li class="nav-item <?php if(basename($_SERVER["SCRIPT_FILENAME"], '.php')=='stations_summary') echo('active');?>">
        <a class="nav-link" href="stations_summary.php">
            <i class="fas fa-fw fa-table"></i>
            <span>Summary</span></a>
    </li>


    <!-- Divider -->
    <hr class="sidebar-divider">

    <!-- Heading -->
    <div class="sidebar-heading">
        NOAA
    </div>

    <!-- Nav Item -->
    <li class="nav-item">
        <a class="nav-link" href="https://www.ncdc.noaa.gov/cdo-web/datatools/lcd" target="_blank">
            <i class="fas fa-solid fa-download"></i>
            <span>LCD Data</span></a>
    </li>

    <!-- Nav Item -->
    <li class="nav-item">
        <a class="nav-link" href="https://www.ncdc.noaa.gov/cdo-web/datatools/selectlocation" target="_blank">
            <i class="fas fa-solid fa-download"></i>
            <span>COOP Data</span></a>
    </li>



    <!-- Divider -->
    <hr class="sidebar-divider">

    <?php
if ($_SESSION['SYSTEM_ENVIRONMENT'] != Config::ENV_PHP_DESKTOP) {

    // allowed only to the users who have admin privileges
    if ($_SESSION['LOGIN_PRIVILEGE']&128) {
    ?>
    <!-- Heading -->
    <div class="sidebar-heading">
        SYSTEM
    </div>

    <!-- Nav Item -->
    <li class="nav-item">
        <a class="nav-link" href="useraccounts.php">
            <i class="fas fa-solid fa-user"></i>
            <span>USER ACCOUNTS</span></a>
    </li>
    <?php
    }
}
    ?>

    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>


</ul>
<!-- End of Sidebar -->

