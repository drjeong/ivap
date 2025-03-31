<?php

include_once ('./inc_functions.php');
$state_array = GetStateArrayData();

?>
<script src="./js/ol.min.js"></script>

<script src="ietdanalysis_commons.min.js"></script>
<script src="ietdanalysis_ss_hichart.min.js"></script>
<script src="./js/d3_functions.min.js"></script>

<script src="chartcommons.min.js"></script>
<script src="floatingbootboxchart.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jstat/1.9.6/jstat.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.min.js"></script>

<script src="ietdanalysis_ss_annualmax.min.js"></script>
<script src="ietdanalysis_ss_idfcurve.min.js"></script>
<script src="ietdanalysis_ss_monthyprecipitation.min.js"></script>
<script src="ietdanalysis_ss_toptenlargest.min.js"></script>
<script src="ietdanalysis_ss_toptenlongest.min.js"></script>
<script src="ietdanalysis_ss_volumetrichydrology.min.js"></script>
<script src="ietdanalysis_ss_trendanalysis.min.js"></script>
<script src="ietdanalysis_ss_anomalies.min.js"></script>
<script src="ietdanalysis_ss_peakoverthreshold.min.js"></script>
<script src="ietdanalysis_ss_annualcycle.min.js"></script>
<script src="ietdanalysis_ss_exceedanceprobability.min.js"></script>
<script src="ietdanalysis_ss_seasonalpca.min.js"></script>
<script src="ietdanalysis_ss_monthlydistribution.min.js"></script>

<script src="ietdanalysis_ss.min.js"></script>


<!-- Page Heading -->
<!--<div class="d-sm-flex align-items-center justify-content-between mb-4">-->
<!--    <div class="text-base font-weight-bold text-primary text-uppercase">Analysis</div>-->
<!--    <a href="#" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">-->
<!--        <i class="fas fa-download fa-sm text-white-50"></i> Generate Report-->
<!--    </a>-->
<!--</div>-->

<!-- Content Row -->
<div class="row">

    <!-- COLUMN -->
    <div class="col-xl-4 col-lg-4 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Select Station</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800"></div>
                    </div>
                </div>

                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="form-group mb-2">
                            <div class = "input-group input-group-sm">
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">STATE:<span style="color:red">*</span></span>
                                <select id="state" name="state" style="color:black; font-size: 9pt;" class ="form-control" onchange="changeState(this.value);">
                                    <option style="font-size: 9pt;" value="" selected>[Select State]</option>
                                    <?php
                                    for ($i=0; $i<count($state_array); $i++)
                                    {
                                        $state=$state_array[$i];
                                        echo ('<option style="font-size: 9pt;" value="'.$state.'">'.$state.'</option>');
                                    }
                                    ?>
                                </select>
                            </div>
                        </div>
                        <div class="form-group mb-2">
                            <div class = "input-group input-group-sm">
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">STATION:<span style="color:red">*</span></span>
                                <select name="station" id="station" style="color:black; font-size: 9pt;" class ="form-control" onchange="GetStationInfo(this.value);"></select>
                            </div>
                        </div>
                        <div class="form-group mb-2">
                            <div class = "input-group input-group-sm">
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">LONGITUDE:</span>
                                <input type='text' id="longitude" name="longitude" style="font-size: 9pt;" class="form-control" value="" readonly/>
                            </div>
                        </div>
                        <div class="form-group mb-2">
                            <div class = "input-group input-group-sm">
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">LATITUDE:</span>
                                <input type='text' id="latitude" name="latitude" style="font-size: 9pt;" class="form-control" value="" readonly/>
                            </div>
                        </div>
                        <div class="form-group mb-2">
                            <div class = "input-group input-group-sm">
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">ELEVATION:</span>
                                <input type='text' id="elevation" name="elevation" style="font-size: 9pt;" class="form-control" value="" readonly/>
                            </div>
                        </div>
                        <div class="form-group mb-2" style="height:75px;">
                            <div class = "input-group input-group-sm" style="height:100%;">
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">DATA AVAILABILITY</span>
                                <input type='text' id="avdatafrom" name="avdatafrom" style="font-size: 9pt;" class="form-control" style="height:50%;" value="" readonly/><br/>
                                <input type='text' id="avdatato" name="avdatato" style="font-size: 9pt;" class="form-control" style="height:50%;" value="" readonly/>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row no-gutters align-items-center" style="margin-top: -2.0rem">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Select Date Period</div>
                    </div>
                </div>

                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="form-group mb-2">
                            <div class='input-group input-group-sm date' id='datepicker_from'>
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">BEGIN DATE:
                                <i class="fas fa-calendar-alt"></i><span style="color:red">*</span></span>
                                <input type='text' id="beginningdate" name="beginningdate" style="font-size: 9pt;" class="form-control" value="" autocomplete="off"/>
                            </div>
                        </div>
                        <div class="form-group mb-2">
                            <div class='input-group input-group-sm date' id='datepicker_to'>
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">END DATE:
                                <i class="fas fa-calendar-alt"></i><span style="color:red">*</span></span>
                                <input type='text' id="endingdate" name="endingdate" style="font-size: 9pt;" class="form-control" value="" autocomplete="off"/>
                            </div>
                        </div>
                        <div class="form-group mb-2">
                            <div class='input-group input-group-sm'>
                                <span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">IETD (1&lt;=IETD&lt;=168):<span style="color:red">*</span></span>
                                <input type='text' id="ietd" name="ietd" style="font-size: 9pt;" class="form-control" value="" autocomplete="off"/>
                                <span class="input-group-addon">&nbsp;<i class="far fa-clock"></i>&nbsp;<span style="min-width:120px;" class="text-xs mb-0 font-weight-bold text-gray-800">HOUR</span></span>
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters align-items-center">
                        <button type="button" onclick="runietdanalysis(); return false;" class="btn btn-sm btn-primary">RUN IETD ANALYSIS</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- COLUMN -->
    <div class="col-xl-4 col-lg-4 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            GEO MAP
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800"></div>
                    </div>
                </div>
                <div class="row no-gutters align-items-center">
                    <!-- Map container -->
                    <div id="map"
                         style="width: 100%;
                            min-width: 300px;
                            height: 360px;
                            border: 1px solid black;
                            padding: 5px;
                            float: left;
                            overflow: hidden;
                            position: relative;"></div>

                    <!-- Initialize the map -->
                    <script>
                        // Call the olInitMap function to render the map
                        const g_olMap = olInitMap('map');
                    </script>

                    <!-- Button to see the map on an online map -->
                    <a id="map_location_href"
                       class="btn btn-sm btn-primary mt-3"
                       style="color: white;"
                       target="_blank">
                        SEE ON AN ONLINE MAP
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- COLUMN -->
    <div class="col-xl-4 col-lg-4 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <!-- Content Row -->
                <div class="row">
                    <div class="row">
                        <div style="margin:3px">
                            <div id="ietdtitle" class="text-xs font-weight-bold text-primary text-uppercase mb-1">IETD Analysis - Analyzing Independent Precipitation Events</div>
                        </div>
<!--                        <div class="col-sm">-->
<!--                            <div class="form-check form-switch">-->
<!--                                <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('div_precipitationdata_sum', this.checked)">-->
<!--                                <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>-->
<!--                            </div>-->
<!--                        </div>-->
                    </div>
                    <div id="div_precipitationdata_sum" class="pagebacklayout_inner_noborder">
                        <div style="margin:3px">
                            <!--            <div id="ietdtitle" class="text-base font-weight-bold text-primary text-uppercase">IETD Anlyais - Analyzing Independent Precipitation Events</div>-->
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
                        </div>
                        <div class="CSSTable_SSPSLIST">
                            <table id="precipitationdata_sum" class="display" style="width:100%;">
                                <thead>
                                <tr>
                                    <th >FROM DATE</th>
                                    <th >TO DATE</th>
                                    <th >HPCP (inch)</th>
                                    <th ># of Events</th>
                                </tr>
                                </thead>
                            </table>
                        </div>
                    </div>
                </div><!-- END Content Row -->
            </div>
        </div>
    </div>

</div> <!-- END Content Row -->






<!-- Content Row -->
<div class="row">

    <!-- Measured Hourly precipitation -->
    <div id="div_chart_hpcp_hourlydata" style="display: none;">
        <div class="row">
            <div class="col-sm">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" onclick="ShowHideDiv('chart_hpcp_hourlydata', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide Original HPCP data</label>
                </div>
            </div>
        </div>
        <div id="chart_hpcp_hourlydata" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
    </div>

    <div style="margin:3px"></div>

    <!-- Sum of IETD precipitation -->
    <div id="div_chart_hpcp_ietd_sum" style="display: none;">
        <div class="row">
            <div class="col-sm">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_ietd_sum', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide IETD Sum</label>
                </div>
            </div>
        </div>
        <div id="chart_hpcp_ietd_sum" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
    </div>

    <div style="margin:3px"></div>

    <!-- Average of IETD precipitation -->
    <div id="div_chart_hpcp_ietd_avg" style="display: none;">
        <div class="row">
            <div class="col-sm">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" onclick="ShowHideDiv('chart_hpcp_ietd_avg', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide IETD Average</label>
                </div>
            </div>
        </div>
        <div id="chart_hpcp_ietd_avg" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
    </div>

    <div style="margin:3px"></div>


    <div id="div_charts01" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_idf_curve', this.checked); ShowHideDiv('chart_hpcp_exceedanceprobability', this.checked); ShowHideDiv('chart_hpcp_anomalies', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4">
                <!-- Intensity-Duration-Frequency (IDF) Curves -->
                <div id="chart_hpcp_idf_curve" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Exceedance Probability -->
                <div id="chart_hpcp_exceedanceprobability" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Anomalies (deviations from the mean/expected values) -->
                <div id="chart_hpcp_anomalies" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
        </div>
    </div>

    <div style="margin:3px"></div>


    <div id="div_charts02" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_top_ten_longest_precipitation', this.checked); ShowHideDiv('chart_hpcp_top_ten_largest_precipitation', this.checked); ShowHideDiv('chart_hpcp_volumetric_hydrology_precipitation', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4">
                <!-- Top Ten Longest Precipitation (Duration) Events -->
                <div id="chart_hpcp_top_ten_longest_precipitation" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Top Ten Largest Precipitation (Volume) Events -->
                <div id="chart_hpcp_top_ten_largest_precipitation" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Volume-based Hydrology (VBH) Analysis -->
                <div id="chart_hpcp_volumetric_hydrology_precipitation" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
        </div>
    </div>

    <div style="margin:3px"></div>

    <div id="div_charts03" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_annual_max_precipitation', this.checked); ShowHideDiv('chart_hpcp_trendanalysis', this.checked);  ShowHideDiv('chart_hpcp_seasonalpac', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4">
                <!-- Measured Annual Maximum Precipitation Events -->
                <div id="chart_hpcp_annual_max_precipitation" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Trend Analysis -->
                <div id="chart_hpcp_trendanalysis" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Seasonal PCA -->
                <div id="chart_hpcp_seasonalpac" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
        </div>
    </div>

    <div style="margin:3px"></div>

    <div id="div_charts04" style="display: none;">
        <div class="row">
            <div class="col-12">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" checked onclick="ShowHideDiv('chart_hpcp_monthly', this.checked); ShowHideDiv('chart_hpcp_annualcylcle', this.checked);  ShowHideDiv('chart_hpcp_monthlyboxplot', this.checked)">
                    <label class="form-check-label" style="font-size: 10px;">Show/Hide</label>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4">
                <!-- Monthly Average Precipitation -->
                <div id="chart_hpcp_monthly" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- Annual Precipitation Cycle -->
                <div id="chart_hpcp_annualcylcle" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
            <div class="col-lg-4">
                <!-- MonthlyDistribution -->
                <div id="chart_hpcp_monthlyboxplot" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
        </div>
    </div>

</div><!-- END Content Row -->