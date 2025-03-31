<?php
include_once ('./inc_functions.php');
$state_array = GetStateArrayData();
?>

<script src="ietdanalysis_commons.min.js"></script>
<script src="ietdanalysis_ms_hichart.min.js"></script>
<script src="ietdanalysis_ms.min.js"></script>
<script src="chartcommons.min.js"></script>
<script src="floatingbootboxchart.min.js"></script>


<script src="https://cdnjs.cloudflare.com/ajax/libs/jstat/1.9.6/jstat.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.min.js"></script>

<script src="ietdanalysis_ms_trendanalysis.min.js"></script>
<script src="ietdanalysis_ms_annualpca.min.js"></script>
<script src="ietdanalysis_ms_monthyprecipitation.min.js"></script>


<!-- Page Heading -->
<!--<div class="d-sm-flex align-items-center justify-content-between mb-4">-->
<!--    <div class="text-base font-weight-bold text-primary text-uppercase">Analysis</div>-->
    <!--    <a href="#" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">-->
    <!--        <i class="fas fa-download fa-sm text-white-50"></i> Generate Report-->
    <!--    </a>-->
<!--</div>-->

<!-- Content Row -->
<div class="row">
    <!-- First Column - List of Stations -->
    <div class="col-xl-4 col-md-4 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <h6 class="text-xs font-weight-bold text-primary text-uppercase mb-3">List of Stations</h6>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">STATE:</span>
                    <select id="state" name="state" class="form-control form-select" onchange="changeState(this.value);" style="font-size: 0.75rem;">
                        <option value="" selected>[Select State]</option>
                        <?php
                        foreach($state_array as $state) {
                            echo "<option value=\"$state\">$state</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">STATIONS:</span>
                    <select name="station" id="station" class="form-control form-select" style="min-height:150px; font-size: 0.75rem;"
                            onchange="ShowStationOnMap();" multiple></select>
                    <button class="btn btn-primary" style="width:80px; font-size: 0.75rem;" onclick="addSelectedStation();">ADD</button>
                </div>

                <h6 class="text-xs font-weight-bold text-primary text-uppercase mb-3">Selected Stations on Map</h6>
                <div id="map" style="width:100%; height:300px; border:1px solid black;"></div>
                <script>g_olMap = olInitMap(id='map', zoomlevel=8);</script>
            </div>
        </div>
    </div>

    <!-- Second Column - Added Stations -->
    <div class="col-xl-4 col-md-4 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <h6 class="text-xs font-weight-bold text-primary text-uppercase mb-3">Added Stations</h6>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">STATIONS:<span class="text-danger">*</span></span>
                    <select name="selectedstations" id="selectedstations" class="form-control form-select"
                            style="height:175px; font-size: 0.75rem;" multiple></select>
                    <button class="btn btn-primary" style="width:80px; font-size: 0.75rem;" onclick="removeSelectedStation();">REMOVE</button>
                </div>

                <h6 class="text-xs font-weight-bold text-primary text-uppercase mb-3">Added Stations on Map</h6>
                <div id="map2" style="width:100%; height:300px; border:1px solid black;"></div>
                <script>olMap2 = olInitMap(id='map2', zoomlevel=2, USCenterLon, USCenterLat);</script>
            </div>
        </div>
    </div>

    <!-- Third Column - Date Selection -->
    <div class="col-xl-4 col-md-4 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <h6 class="text-xs font-weight-bold text-primary text-uppercase mb-3">Select Date Period</h6>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">DATA AVAILABILITY</span>
                    <input type="text" id="avdatafrom" name="avdatafrom" class="form-control" readonly/>
                    <input type="text" id="avdatato" name="avdatato" class="form-control" readonly/>
                </div>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">
                        BEGIN DATE&nbsp;&nbsp;<i class="fas fa-calendar-alt"></i><span class="text-danger">*</span>
                    </span>
                    <input type="text" id="beginningdate" name="beginningdate" class="form-control"/>
                </div>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">
                        END DATE&nbsp;&nbsp;<i class="fas fa-calendar-alt"></i><span class="text-danger">*</span>
                    </span>
                    <input type="text" id="endingdate" name="endingdate" class="form-control"/>
                </div>

                <div class="input-group input-group-sm mb-3">
                    <span class="input-group-text" style="min-width:120px; font-size: 0.75rem;">
                        IETD (1<=IETD<=168):<span class="text-danger">*</span>
                    </span>
                    <input type="text" id="ietd" name="ietd" class="form-control"/>
                    <span class="input-group-text" style="font-size: 0.75rem;">
                        <i class="far fa-clock"></i> HOUR
                    </span>
                </div>

                <button type="button" onclick="runIETDAnalysis(); return false;"
                        class="btn btn-primary w-100" style="font-size: 0.75rem;">RUN IETD ANALYSIS</button>
            </div>
        </div>
    </div>
</div>

<!-- Measured Hourly precipitation -->
<div id="div_datatable_hpcp_hourlydata" style="display: block;">
    <div class="row">
        <div class="col-sm">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('datatable_hpcp_hourlydata', this.checked)">
                <label class="form-check-label" style="font-size: 10px;">Show/Hide HPCP data</label>
            </div>
        </div>
    </div>
    <div class="row" id="datatable_hpcp_hourlydata">
        <div class="pagebacklayout_inner_noborder">
            <div class="btn-toolbar">
                <button id="dnietddata" type="button" onclick="downloadIETDData(); return false;"
                        class="btn-xs btn-primary d-flex align-items-center" style="display: none; font-size: 0.75rem;">
                    <i class="fas fa-download me-1"></i>IETD
                </button>&nbsp;
                <button id="dnrawdata" type="button" onclick="downloadOriginalHP(); return false;"
                        class="btn-xs btn-primary d-flex align-items-center" style="display: none; font-size: 0.75rem;">
                    <i class="fas fa-download me-1"></i>HPD
                </button>
            </div>

            <div class="CSSTable_SSPSLIST">
                <table id="precipitationdata_sum" class="display" style="width:100%;">
                    <thead>
                    <tr>
                        <th >STATION</th>
                        <th >FROM DATE</th>
                        <th >TO DATE</th>
                        <th >HPCP (inch)</th>
                        <th ># of Events</th>
                    </tr>
                    </thead>
                    <tfoot>
                    <tr>
                        <th >STATION</th>
                        <th >FROM DATE</th>
                        <th >TO DATE</th>
                        <th >HPCP (inch)</th>
                        <th ># of Events</th>
                    </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</div>


<!-- Content Row -->
<div class="row">

    <!-- Measured Hourly precipitation -->
    <div id="div_chart_hpcp_hourlydata" style="display: none;">
        <div class="row">
            <div class="col-sm">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_hourlydata', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide IETD HPCP data</label>
                </div>
            </div>
        </div>
        <div id="chart_hpcp_hourlydata" style="display: block; min-width: 310px; margin: 0 auto">
            <!-- Charts will be added here -->
        </div>
    </div>

    <div style="margin:3px"></div>

    <div id="div_charts01" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_trendanalysis', this.checked);">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <!-- Trend Analysis -->
            <div id="chart_hpcp_trendanalysis" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
        </div>
    </div>

    <div style="margin:3px"></div>

    <div id="div_charts02" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_seasonalpca', this.checked);">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <!-- Trend Analysis -->
            <div id="chart_hpcp_annualpca" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
        </div>
    </div>


    <div style="margin:3px"></div>

    <div id="div_charts03" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_monthlyprecipitation', this.checked);">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <!-- Trend Analysis -->
            <div id="chart_hpcp_monthlyprecipitation" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
        </div>
    </div>

</div

<!-- END Content Row -->
