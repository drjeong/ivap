/**
 * Handling necessary functions in IETD Analysis.
 * @author Dong Hyun Jeong <djeong@udc.edu>
 *     6/19/2023 - initial version
 *     1/25/2023 - adding D3 graph controls
 *
 */

/**
 * Defining Global Variables
 */
let g_DataTable_HPCP_SUM = null;
let g_DatePicker_beginningdate = null;
let g_DatePicker_endingdate = null;
let g_AnalyzedIETDData = null;
let g_RawHPCPData = null;

let g_ZoomingEnabled = false;   // check if zooming is enabled or not
let g_PreviousTimeRangeWhenZoomingActivated = []; // used to track the previous time range when zooming is activated

const INNERPADDING = 0.05, OUTERPADDING = 0.05;
const MARGIN = {top: 20, right: 20, bottom: 50, left: 60};
const BARCHART_POSITION = {title_y: 10};

let g_PlotMonthPrecipitation = null;
let g_PlotIDFCurve = null;
let g_plotAnnualMaximumPrecipitation = null;
let g_plotTopTenLargestPrecipitation = null;
let g_plotTopTenLongestPrecipitation = null;
let g_plotVolumetricHydrology = null;
let g_plotTrendAnalysis = null;
let g_plotAnomaly = null;
let g_plotexceedanceprobabilty = null;
let g_plotAnnualCycle = null;
let g_plotSeasonalPCA = null;
let g_plotMonthlyBox = null;


/**
 * Download IETD data with DataTables export using custom filename
 * @returns {Promise<void>} A promise that resolves when the download is complete
 */
async function downloadIETDData() {
    try {
        // Show the full page spinner
        showFullPageSpinner();

        // Get the custom filename
        const fileName = getFileName();

        // Get export data from DataTables
        const exportData = g_DataTable_HPCP_SUM.buttons.exportData({
            modifier: {
                search: 'applied',
                order: 'applied'
            }
        });

        // Convert data to CSV format
        let csv = '';

        // Add headers
        csv += exportData.header.join(',') + '\r\n';

        // Add rows
        exportData.body.forEach(function(row) {
            // Replace any commas within fields to prevent CSV parsing issues
            const safeRow = row.map(field => {
                // If field contains comma, quote it
                if (typeof field === 'string' && field.includes(',')) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            });

            csv += safeRow.join(',') + '\r\n';
        });

        // Create Blob with CSV data
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;

        // Add the link to the document and click it
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Hide spinner and show notification
        hideFullPageSpinner();
        showNotification('Download complete', `Your data has been downloaded as "${fileName}".`);

    } catch (error) {
        console.error('Download error:', error);

        // Hide spinner in case of error
        hideFullPageSpinner();

        // Show error notification
        showNotification('Download error', 'There was a problem with your download. Please try again.');

        // Fall back to the original method if our custom approach fails
        try {
            // Store the original button title/text
            const originalButtonTitle = g_DataTable_HPCP_SUM.button('.buttons-csv').text();

            // Temporarily change the button title/text to include our filename
            g_DataTable_HPCP_SUM.button('.buttons-csv').text(`Export as ${fileName}`);

            // Trigger the export
            g_DataTable_HPCP_SUM.button('.buttons-csv').trigger();

            // Reset the button title/text after a short delay
            setTimeout(() => {
                g_DataTable_HPCP_SUM.button('.buttons-csv').text(originalButtonTitle);
            }, 1000);

        } catch (fallbackError) {
            console.error('Fallback download error:', fallbackError);
        }
    }
}

/**
 * Generate filename
 * @returns {string} The formatted filename
 */
function getFileName() {
    const state = document.getElementById("state").value;
    const fromDate = document.getElementById("beginningdate").value;
    const toDate = document.getElementById("endingdate").value;
    const e = document.getElementById("station");
    let stationName = e.options[e.selectedIndex].text;
    stationName = stationName.split("(")[0];
    stationName = stationName.trim();

    const formattedStationName = stationName.replace(/\|/g, "-");

    // Convert state to uppercase (equivalent to strtoupper($State))
    const formattedState = state.toUpperCase();

    // Construct the filename (equivalent to $FName = ... .".csv")
    const fileName = `${formattedState}-${formattedStationName}-${fromDate}-${toDate}_IETD.csv`;

    return fileName;
}

/**
 * Fetch user entered parameter values
 * @returns {string}
 */
function getParams()
{
    let e = document.getElementById("station");
    let station_name = e.options[e.selectedIndex].text;
    station_name = station_name.split("(")[0];
    station_name = station_name.trim();

    const state = document.getElementById("state").value;
    const station = document.getElementById("station").value;
    const ietd = document.getElementById("ietd").value;
    const beginningdate = document.getElementById("beginningdate").value;
    const endingdate = document.getElementById("endingdate").value;

    const param = "state=" + encodeURIComponent(state) +
        "&station=" + encodeURIComponent(station) +
        "&name="+encodeURIComponent(station_name) +
        "&ietd="+encodeURIComponent(ietd) +
        "&from="+encodeURIComponent(beginningdate) +
        "&to="+encodeURIComponent(endingdate);

    return param;
}

/**
 * Download raw HPD data
 * Download original data using fetch API with async/await
 * @returns {Promise<void>} A promise that resolves when the download is complete
 */
async function downloadOriginalHP() {
    try {
        // First validate the form
        if (validateForm() === false) return;

        // Get parameters for the download
        const param = getParams();

        // Show the full page spinner
        showFullPageSpinner();

        // Use fetch to download the file
        const response = await fetch('ietdanalysis_ss_dndata.php?' + param);

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the filename from the Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download.csv'; // Default filename

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;

        // Add the link to the document and click it
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Hide spinner and show notification
        hideFullPageSpinner();
        showNotification('Download successful', `Your file has been downloaded as "${filename}".`);

    } catch (error) {
        console.error('Download error:', error);

        // Hide spinner in case of error
        hideFullPageSpinner();

        // Show error notification
        showNotification('Download error', 'There was a problem with your download. Please try again.');
        //
        // // Fall back to iframe method if fetch fails
        // try {
        //     // Create a promisified iframe download
        //     await new Promise((resolve) => {
        //         let downloadFrame = document.getElementById('hidden-download-frame');
        //
        //         if (!downloadFrame) {
        //             downloadFrame = document.createElement('iframe');
        //             downloadFrame.id = 'hidden-download-frame';
        //             downloadFrame.style.display = 'none';
        //             document.body.appendChild(downloadFrame);
        //         }
        //
        //         // Set up load event to resolve the promise
        //         downloadFrame.onload = resolve;
        //
        //         // Set iframe source to initiate download
        //         downloadFrame.src = 'ietdanalysis_ss_dndata.php?' + param;
        //
        //         // Resolve the promise after a timeout in case onload doesn't fire
        //         setTimeout(resolve, 1000);
        //     });
        //
        //     showNotification('Download initiated', 'Your download has been initiated using fallback method.');
        //
        // } catch (fallbackError) {
        //     console.error('Fallback download error:', fallbackError);
        //     showNotification('Download failed', 'Unable to start download. Please try again later.');
        // }
    }
}

/**
 * Run IETD analysis and generate charts
 */
function runietdanalysis() {
    if (validateForm() === false) return;

    // Show full-page spinner at the beginning
    showFullPageSpinner();

    try {
        // if charts exist, destroy all charts
        destroyAllCharts();

        const param = getParams();

        // Use a Promise to handle the AJAX request
        const dataPromise = new Promise((resolve, reject) => {
            $.getJSON('ietdanalysis_ss_data.php?callback=?&' + param)
                .done(function(data) {
                    resolve(data);
                })
                .fail(function(error) {
                    reject(error);
                });
        });

        // Process data when it's available
        dataPromise
            .then(function(data) {
                // Show all charts
                showAllCharts(true);

                // By default, the following charts are hidden
                ShowHideDiv('chart_hpcp_ietd_avg', false);
                ShowHideDiv('chart_hpcp_hourlydata', false);

                // Process the data
                analyzeHPCPAnalyzeData(data);

            })
            .catch(function(error) {
                console.error("Error loading data:", error);
            })
            .finally(function() {
                // Hide the spinner when everything is complete, whether successful or not
                hideFullPageSpinner();
            });

    } catch (error) {
        console.error("Error in runietdanalysis:", error);
        // Make sure to hide the spinner even if there's an unexpected error
        hideFullPageSpinner();
    }
}
/**
 * Show or hide div region
 * @param div
 * @param checked
 * @constructor
 */
function ShowHideDiv(div, checked)
{
    if (checked) {
        document.getElementById(div).style.display = "block";

        if (g_PlotMonthPrecipitation) g_PlotMonthPrecipitation.resize();
        if (g_PlotIDFCurve) g_PlotIDFCurve.resize();
        if (g_plotAnnualMaximumPrecipitation) g_plotAnnualMaximumPrecipitation.resize();
        if (g_plotTopTenLargestPrecipitation) g_plotTopTenLargestPrecipitation.resize();
        if (g_plotTopTenLongestPrecipitation) g_plotTopTenLongestPrecipitation.resize();
        if (g_plotVolumetricHydrology) g_plotVolumetricHydrology.resize();
        if (g_plotTrendAnalysis) g_plotTrendAnalysis.resize();
        if (g_plotAnomaly) g_plotAnomaly.resize();
        if (g_plotexceedanceprobabilty) g_plotexceedanceprobabilty.resize();
        if (g_plotAnnualCycle) g_plotAnnualCycle.resize();
        if (g_plotSeasonalPCA) g_plotSeasonalPCA.resize();
        if (g_plotMonthlyBox) g_plotMonthlyBox.resize();

    } else {
        document.getElementById(div).style.display = "none";
    }
}

/**
 * Show DIVs for charts
 * @param bShow
 * @constructor
 */
function showAllCharts(bShow = true)
{
    removeAllHighCharts();   // remove all hicharts
    if (bShow)
    {
        document.getElementById("div_chart_hpcp_hourlydata").style.display = "block";
        document.getElementById("div_chart_hpcp_ietd_sum").style.display = "block";
        document.getElementById("div_chart_hpcp_ietd_avg").style.display = "block";

        document.getElementById("div_charts01").style.display = "block";
        document.getElementById("div_charts02").style.display = "block";
        document.getElementById("div_charts03").style.display = "block";
        document.getElementById("div_charts04").style.display = "block";

        document.getElementById("dnietddata").style.display = "block";
        document.getElementById("dnrawdata").style.display = "block";

    }
    else
    {
        // hide all charts and buttons
        document.getElementById("div_chart_hpcp_hourlydata").style.display = "none";
        document.getElementById("div_chart_hpcp_ietd_sum").style.display = "none";
        document.getElementById("div_chart_hpcp_ietd_avg").style.display = "none";

        document.getElementById("div_charts01").style.display = "none";
        document.getElementById("div_charts02").style.display = "none";
        document.getElementById("div_charts03").style.display = "none";
        document.getElementById("div_charts04").style.display = "none";

        document.getElementById("dnietddata").style.display = "none";
        document.getElementById("dnrawdata").style.display = "none";

        resetInputs();
    }
}

/**
 * Reset user entered values
 */
function resetInputs()
{
    g_DataTable_HPCP_SUM.clear().draw();
    document.getElementById("latitude").value = '';
    document.getElementById("longitude").value = '';
    document.getElementById("elevation").value = '';
    document.getElementById("avdatafrom").value = '';
    document.getElementById("avdatato").value = '';
    document.getElementById("beginningdate").value = '';
    document.getElementById("endingdate").value = '';
    document.getElementById("ietd").value = '';
    document.getElementById("ietdtitle").innerHTML = "IETD Analysis - Analyzing Independent Precipitation Events";
}

/**
 * Validating user entered values
 * @returns {boolean}
 * @constructor
 */
function validateForm()
{
    if (document.getElementById("state").value == "") {
        document.getElementById("state").focus();
        Swal.fire({title:"Oops...", text:"State needs to be selected!!", icon:"error"});
        return false;
    }
    if (document.getElementById("station").value == "") {
        document.getElementById("station").focus();
        Swal.fire({title:"Oops...", text:"Station needs to be selected!!", icon:"error"});
        return false;
    }
    if (document.getElementById("beginningdate").value == "") {
        document.getElementById("beginningdate").focus();
        Swal.fire({title:"Oops...", text:"From date needs to be entered!!", icon:"error"});
        return false;
    }
    if (document.getElementById("endingdate").value == "") {
        document.getElementById("endingdate").focus();
        Swal.fire({title:"Oops...", text:"To date needs to be entered!!", icon:"error"});
        return false;
    }
    let BeginningDate = new Date(document.getElementById("beginningdate").value);
    let EndingDate = new Date(document.getElementById("endingdate").value);
    if (BeginningDate == EndingDate){
        document.getElementById("endingdate").focus();
        Swal.fire({title:"Oops...", text:"The beginning date and the ending date cannot be the same!!", icon:"error"});
        return false;
    }
    if (BeginningDate > EndingDate){
        document.getElementById("endingdate").focus();
        Swal.fire({title:"Oops...", text:"The ending date must be after the beginning date!!", icon:"error"});
        return false;
    }
    if (document.getElementById("ietd").value == "") {
        document.getElementById("ietd").focus();
        Swal.fire({title:"Oops...", text:"IETD range value needs to be entered!!", icon:"error"});
        return false;
    }
    if (Number.isInteger(Number(document.getElementById("ietd").value)) == false || Number(document.getElementById("ietd").value) < 1) {
        document.getElementById("ietd").focus();
        Swal.fire({title:"Oops...", text:"IETD range value must be a positive integer value ( value >= 1 )!!", icon:"error"});
        return false;
    }
    return true;
}

/**
 * Change state & fetch station information within the selected state.
 * @param state
 */
function changeState(state)
{
    showAllCharts(false);

    // remove station list
    let selectcomboBox = document.getElementById("station");
    while (selectcomboBox.options.length > 0) {
        selectcomboBox.remove(0);
    }

    if (state == '') {
        return;
    }

    // remove station list per state
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            let obj = JSON.parse(xmlhttp.responseText.trim());
            if (obj != null)
            {
                let option = document.createElement("option");
                option.value = '';
                option.text = '[Select Station]';
                selectcomboBox.add(option);
                for (let i=0; i<obj.length; i++){
                    let option = document.createElement("option");
                    option.value = obj[i].IDX;
                    option.text = obj[i].NAME + " (" + obj[i].BEG_DT + "~" + obj[i].END_DT + ")";
                    selectcomboBox.add(option);
                }
            }
            else
            {
                Swal.fire({
                    title: "Error Occurred!",
                    text: "unexpected error occurred!!",
                    icon: "warning"
                });
            }
        }
    }
    let param = "state="+state;
    xmlhttp.open("GET", "get_hourlydata_stationlist.php?"+param, true);
    xmlhttp.send();
}

/**
 * Get moment date
 * @param strDate
 * @returns {*}
 * @constructor
 */
function Getmoment(strDate)
{
    const datetime = strDate.split(" ");
    const date = datetime[0].split("-");
    // let time = datetime[1].split(":");
    date[1] = date[1] - 1; // convert to javascript month : beginning with 0 for January to 11 for December

    // let momentDate = moment([date[0], date[1], date[2], time[0], time[1], time[2], 0]);
    let momentDate = moment([date[0], date[1], date[2], 0, 0, 0, 0]);

    return momentDate;
}

/**
 * Get station information
 * @param station
 * @constructor
 */
function GetStationInfo(station)
{
    showAllCharts(false);

    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            let obj = JSON.parse(xmlhttp.responseText.trim());
            if (obj != null)
            {
                // Mapping to OpenLayers map
                olSetNewMapPosition(g_olMap, obj[0].Longitude, obj[0].Latitude);

                // // https://maps.google.com/?q=38.9446016,-77.0656704
                let mapHrefUrl = "https://maps.google.com?q=" + obj[0].Latitude + "," + obj[0].Longitude + "";
                document.getElementById("map_location_href").href = mapHrefUrl;

                document.getElementById("latitude").value = obj[0].Latitude;
                document.getElementById("longitude").value = obj[0].Longitude;
                document.getElementById("elevation").value = obj[0].Elevation;
                document.getElementById("avdatafrom").value = obj[0].DataFrom;
                document.getElementById("avdatato").value = obj[0].DataTo;
                document.getElementById("beginningdate").value = obj[0].DataFrom;
                document.getElementById("endingdate").value = obj[0].DataTo;

                const DateFrom = Getmoment(obj[0].DataFrom);
                const DateTo = Getmoment(obj[0].DataTo);

                g_DatePicker_beginningdate.dates.setValue(tempusDominus.DateTime.convert(new Date(DateFrom)));
                g_DatePicker_beginningdate.updateOptions({
                    restrictions: {
                        minDate: new Date(DateFrom),
                        maxDate: new Date(DateTo),
                    }
                });

                g_DatePicker_endingdate.dates.setValue(tempusDominus.DateTime.convert(new Date(DateTo)));
                g_DatePicker_endingdate.updateOptions({
                    restrictions: {
                        minDate: new Date(DateFrom),
                        maxDate: new Date(DateTo),
                    }
                });
            }
            else
            {
                Swal.fire({
                    title: "Error Occurred!",
                    text: "unexpected error occurred!!",
                    icon: "warning"
                });
            }
        }
    }
    xmlhttp.open("GET", "get_hourlydata_stationinfo.php?station="+station, true);
    xmlhttp.send();
}

/**
 * Convert UNIX timestamp to javascript time
 * @param UNIX_timestamp
 * @returns {string}
 */
function timeConverter(UNIX_timestamp){
    const date = new Date(UNIX_timestamp).toISOString().substr(0, 19).replace('T', ' ');
    return date;
}

/**
 * Convert UNIX timestamp to Javascript time
 * Showing only up to hours (excluding minutes)
 * @param UNIX_timestamp
 * @returns {string}
 */
function timeFormat(UNIX_timestamp){
    const date = new Date(UNIX_timestamp).toISOString().substr(0, 19).replace('T', ' ').replace(':00:00', 'h')
    return date;
}

/**
 * Convert UNIX timestamp to Javascript time
 * Showing only up to hours (excluding minutes and seconds)
 * @param UNIX_timestamp1
 * @param UNIX_timestamp2
 * @returns {string}
 */
function timePeriod(UNIX_timestamp1, UNIX_timestamp2){
    const dateFrom = new Date(UNIX_timestamp1);
    const dateTo = new Date(UNIX_timestamp2);
    const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


    if ( dateFrom.getUTCFullYear() != dateTo.getUTCFullYear() ) {
        const from = dateFrom.getUTCFullYear() + '-' + month[dateFrom.getUTCMonth()] + '-' + dateFrom.getUTCDate().toString().padStart(2, "0") + ' ' + dateFrom.getUTCHours() + 'h';
        const to = dateTo.getUTCFullYear() + '-' + month[dateTo.getUTCMonth()] + '-' + dateTo.getUTCDate().toString().padStart(2, "0") + ' ' + dateTo.getUTCHours() + 'h';
        return from + ' ~ ' + to;
    }
    if ( dateFrom.getUTCFullYear() == dateTo.getUTCFullYear() && dateFrom.getUTCMonth() != dateTo.getUTCMonth()) {
        const from = dateFrom.getUTCFullYear() + '-' + month[dateFrom.getUTCMonth()] + '-' + dateFrom.getUTCDate().toString().padStart(2, "0") + ' ' + dateFrom.getUTCHours() + 'h';
        const to = month[dateTo.getUTCMonth()] + '-' + dateTo.getUTCDate().toString().padStart(2, "0") + ' ' + dateTo.getUTCHours() + 'h';
        return from + ' ~ ' + to;
    }
    if ( dateFrom.getUTCFullYear() == dateTo.getUTCFullYear() && dateFrom.getUTCMonth() == dateTo.getUTCMonth() && dateFrom.getUTCDate() != dateTo.getUTCDate()) {
        const from = dateFrom.getUTCFullYear() + '-' + month[dateFrom.getUTCMonth()] + '-' + dateFrom.getUTCDate().toString().padStart(2, "0") + ' ' + dateFrom.getUTCHours() + 'h';
        const to = month[dateTo.getUTCMonth()] + '-' + dateTo.getUTCDate().toString().padStart(2, "0") + ' ' + dateTo.getUTCHours() + 'h';
        return from + ' ~ ' + to;
    }

    const from = dateFrom.getUTCFullYear() + '-' + month[dateFrom.getUTCMonth()] + '-' + dateFrom.getUTCDate().toString().padStart(2, "0") + ' ' + dateFrom.getUTCHours() + 'h';
    const to = dateTo.getUTCHours() + 'h';
    return from + ' ~ ' + to;
}

/**
 * Performing IETD analysis
 * @param IETDhour
 * @param hourlydata
 * @returns {*[]}
 * @constructor
 */
function IETDAnalysis(IETDhour, hourlydata)
{
    // IETD analysis
    IETDhour_unixtimestamp = parseInt(IETDhour) * 60 * 1000;

    let Event = null;
    let IETDDATA = [];

    for(let i=0; i<hourlydata.length; i++)
    {
        let Date_Begin = hourlydata[i][0];
        let Date_End = hourlydata[i][1];
        let HPD = hourlydata[i][2];

        if (Event == null)
        {
            Event = [Date_Begin, Date_End, HPD, 1 ];
        }
        else
        {

            if ((Date_Begin - Event[1])/60  <= IETDhour_unixtimestamp)
            { // considered the same event
                Event[1] = Date_End;
                Event[2] += HPD;
                Event[3] += 1;
            }
            else
            {
                // not a part of the previous event
                IETDDATA.push(Event);
                // delete Event;

                // new event
                Event = [Date_Begin, Date_End, HPD, 1 ];
            }
        }
    }
    if (Event != null)
    {
        IETDDATA.push(Event);
    }

    return IETDDATA;
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

/**
 * Build HPD SUM & AVG charts
 * @param ietd_data
 */
function buildHPCPSUMAVGCharts(IETDhour, ietd_data)
{
    let DataTable_dataSet = [];

    // formatting data for sum and average charts
    let chart_ietd_sum_data = [];
    let chart_ietd_avg_data = [];
    for(let i=0; i<ietd_data.length; i++)
    {
        const datefrom = ietd_data[i][0];
        const dateto = ietd_data[i][1];
        let sum = ietd_data[i][2];
        const count = ietd_data[i][3];
        let avg = sum / count;

        sum = roundToTwo(sum);
        avg = roundToTwo(avg);
        DataTable_dataSet.push([timeConverter(datefrom), timeConverter(dateto), sum, count]);

        data_element = [];
        data_element.push(datefrom);
        data_element.push(0);    // add zero
        chart_ietd_sum_data.push(data_element);
        chart_ietd_avg_data.push(data_element);

        data_element = [];
        data_element.push(datefrom);
        data_element.push(sum);
        chart_ietd_sum_data.push(data_element);

        data_element = [];
        data_element.push(datefrom);
        data_element.push(avg);
        chart_ietd_avg_data.push(data_element);

        data_element = [];
        data_element.push(dateto);
        data_element.push(sum);
        chart_ietd_sum_data.push(data_element);

        data_element = [];
        data_element.push(dateto);
        data_element.push(avg);
        chart_ietd_avg_data.push(data_element);

        data_element = [];
        data_element.push(dateto);
        data_element.push(0);    // add zero
        chart_ietd_sum_data.push(data_element);
        chart_ietd_avg_data.push(data_element);
    }
    // delete ietd_data;

    const IETDHour_text = 'IETD=' + IETDhour + ' ' + ((IETDhour > 1)?'hours':'hour');

    // create HPD IETD SUM chart
    createChart('chart_hpcp_ietd_sum', 'Sum of Independent Precipitation Events ('+IETDHour_text+')', 'center', '', 'HPD', chart_ietd_sum_data);

    // create HPD IETD AVG chart
    createChart('chart_hpcp_ietd_avg', 'Avg of Independent Precipitation Events ('+IETDHour_text+')', 'center', '', 'HPD', chart_ietd_avg_data);

    g_DataTable_HPCP_SUM.clear();
    g_DataTable_HPCP_SUM.rows.add( DataTable_dataSet ).draw();
}

/**
 * Create HPD chart with raw HPD data
 * @param rawHPCPData
 */
function buildHPCPOrgChart(rawHPCPData)
{
    // formatting data for original HPD chart
    let chart_rawHPCPData = [];
    for(let i=0; i<rawHPCPData.length; i++)
    {
        const datefrom = rawHPCPData[i][0];
        const dateto = rawHPCPData[i][1];
        let hpcp = rawHPCPData[i][2];
        // let count = rawHPCPData[i][3];
        hpcp = roundToTwo(hpcp);

        data_element = [];
        data_element.push(datefrom);
        data_element.push(0);    // add zero
        chart_rawHPCPData.push(data_element);

        data_element = [];
        data_element.push(datefrom);
        data_element.push(hpcp);
        chart_rawHPCPData.push(data_element);

        data_element = [];
        data_element.push(dateto);
        data_element.push(hpcp);
        chart_rawHPCPData.push(data_element);

        data_element = [];
        data_element.push(dateto);
        data_element.push(0);    // add zero
        chart_rawHPCPData.push(data_element);
    }
    // delete rawHPCPData;

    createChart('chart_hpcp_hourlydata', 'Original Hourly Precipitation Data (HPD)', 'center', '', 'HPCP', chart_rawHPCPData);
}

/**
 * Destroy All Charts
 */
function destroyAllCharts()
{
    // Destroy existing plot if it exists
    if (g_PlotMonthPrecipitation) {
        g_PlotMonthPrecipitation.destroy();
        g_PlotMonthPrecipitation = null;
    }
    if (g_PlotIDFCurve) {
        g_PlotIDFCurve.destroy();
        g_PlotIDFCurve = null;
    }
    if (g_plotTopTenLargestPrecipitation) {
        g_plotTopTenLargestPrecipitation.destroy();
        g_plotTopTenLargestPrecipitation = null;
    }
    if (g_plotTopTenLongestPrecipitation) {
        g_plotTopTenLongestPrecipitation.destroy();
        g_plotTopTenLongestPrecipitation = null;
    }
    if (g_plotVolumetricHydrology) {
        g_plotVolumetricHydrology.destroy();
        g_plotVolumetricHydrology = null;
    }
    if (g_plotTrendAnalysis) {
        g_plotTrendAnalysis.destroy();
        g_plotTrendAnalysis = null;
    }
    if (g_plotAnomaly) {
        g_plotAnomaly.destroy();
        g_plotAnomaly = null;
    }
    if (g_plotexceedanceprobabilty) {
        g_plotexceedanceprobabilty.destroy();
        g_plotexceedanceprobabilty = null;
    }
    if (g_plotAnnualCycle) {
        g_plotAnnualCycle.destroy();
        g_plotAnnualCycle = null;
    }
    if (g_plotSeasonalPCA) {
        g_plotSeasonalPCA.destroy();
        g_plotSeasonalPCA = null;
    }
    if (g_plotMonthlyBox) {
        g_plotMonthlyBox.destroy();
        g_plotMonthlyBox = null;
    }
}

/**
 * Create All Charts
 * @param IETDhour
 * @param rawHPCPData
 * @param ietdata
 */
function createAllCharts(IETDhour, rawHPCPData, IETDData)
{
    // destroy all charts
    destroyAllCharts();

    // create original HPCP chart
    buildHPCPOrgChart(rawHPCPData);

    // create HPCP SUM & AVG charts
    buildHPCPSUMAVGCharts(IETDhour, IETDData);

    // IDF Curve
    g_PlotIDFCurve = new IDFCurvePlot('chart_hpcp_idf_curve', rawHPCPData, IETDhour);

    // Month Precipitation plot
    g_PlotMonthPrecipitation = new MonthlyPrecipitationPlot('chart_hpcp_monthly', rawHPCPData, IETDData);

    // Extreme Precipitation Event Analysis
    // create D3 histogram - Annual Maximum Precipitation Events ( Start time, End Time, Volume, Duration and Intensity)
    g_plotAnnualMaximumPrecipitation = new AnnualMaximumPrecipitationPlot('chart_hpcp_annual_max_precipitation', IETDhour, IETDData);

    // 10 Largest (Volume) Precipitation Events
    g_plotTopTenLargestPrecipitation = new TopTenLargestPrecipitationPlot('chart_hpcp_top_ten_largest_precipitation', IETDhour, IETDData);

    // 10 Longest Precipitation Events
    g_plotTopTenLongestPrecipitation = new TopTenLongestPrecipitationPlot('chart_hpcp_top_ten_longest_precipitation', IETDhour, IETDData);

    // (4) Graphical plot of Precipitation volume (y axis) and Time (x axis)

    // Volume-based Hydrology (VBH) Analysis
    g_plotVolumetricHydrology = new VolumetricHydrologyPlot('chart_hpcp_volumetric_hydrology_precipitation', IETDhour, IETDData);

    // Trend Analysis
    g_plotTrendAnalysis = new TrendAnalysisPlot('chart_hpcp_trendanalysis', IETDhour, IETDData);

    // Anomalies (deviations from the mean/expected values)
    g_plotAnomaly = new AnomalyPlot('chart_hpcp_anomalies', IETDhour, IETDData);

    // Exceedance Probability
    g_plotexceedanceprobabilty = new ExceedanceProbabilityPlot('chart_hpcp_exceedanceprobability', IETDhour, IETDData);

    // Annual Cycle
    g_plotAnnualCycle = new AnnualCyclePlot('chart_hpcp_annualcylcle', IETDhour, IETDData);

    // Duration curve
    g_plotSeasonalPCA = new SeasonalPCAPlot('chart_hpcp_seasonalpac', IETDhour, IETDData);

    // Duration curve
    g_plotMonthlyBox = new MonthlyDistribution ('chart_hpcp_monthlyboxplot', IETDhour, IETDData);

    // show label
    document.getElementById("ietdtitle").innerHTML = "IETD Analysis - Analyzing Independent Precipitation Events (<span style='color:red'>"
        + document.getElementById("ietd").value +" hour(s)</span>)";
}

/**
 * Debounce helper function
 * @param func
 * @param wait
 * @returns {(function(...[*]): void)|*}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function Zoom_based_UpdateCharts(starttime, endtime)
{
    // start loading spinner
    const IETDhour = document.getElementById("ietd").value;

    if (starttime !== undefined && endtime !== undefined) {
        // generate data based on the selected start and end time
        let newIETDData = [];
        let newRawData = [];

        // fetch data based on the selected time range
        for(let i=0; i<g_AnalyzedIETDData.length; i++) {
            const datefrom = g_AnalyzedIETDData[i][0];
            const dateto = g_AnalyzedIETDData[i][1];

            // evaluate the event data is within the selected time range
            if (starttime <= datefrom && dateto <= endtime) {
                newIETDData.push(g_AnalyzedIETDData[i]);
            }
        }

        for(let i=0; i<g_RawHPCPData.length; i++) {
            const datefrom = g_RawHPCPData[i][0];
            const dateto = g_RawHPCPData[i][1];

            // evaluate the event data is within the selected time range
            if (starttime <= datefrom && dateto <= endtime) {
                newRawData.push(g_RawHPCPData[i]);
            }
        }

        // update Extreme Precipitation Event Analysis
        if (g_PlotMonthPrecipitation) g_PlotMonthPrecipitation.updateData(newRawData, newIETDData);
        if (g_PlotIDFCurve) g_PlotIDFCurve.updateData(newRawData);
        if (g_plotAnnualMaximumPrecipitation) g_plotAnnualMaximumPrecipitation.updateData(newIETDData, IETDhour);
        if (g_plotTopTenLargestPrecipitation) g_plotTopTenLargestPrecipitation.updateData(newIETDData, IETDhour);
        if (g_plotTopTenLongestPrecipitation) g_plotTopTenLongestPrecipitation.updateData(newIETDData, IETDhour);
        if (g_plotVolumetricHydrology) g_plotVolumetricHydrology.updateData(newIETDData, IETDhour);
        if (g_plotTrendAnalysis) g_plotTrendAnalysis.updateData(newIETDData, IETDhour);
        if (g_plotAnomaly) g_plotAnomaly.updateData(newIETDData, IETDhour);
        if (g_plotexceedanceprobabilty) g_plotexceedanceprobabilty.updateData(newIETDData, IETDhour);
        if (g_plotAnnualCycle) g_plotAnnualCycle.updateData(newIETDData, IETDhour);
        if (g_plotSeasonalPCA) g_plotSeasonalPCA.updateData(newIETDData, IETDhour);
        if (g_plotMonthlyBox) g_plotMonthlyBox.updateData(newIETDData, IETDhour);
    }
    // end loading spinner
}

function UncertaintyComputation(IETDdata)
{
    // # of abnormal (r_x)
    // # of normal (a_x)
    let a_x = baseRate;
    let alpha, beta;
    for (let hr = 0; hr < 24; hr++) {
        const r_x = SL24hours[hr].abnormal;
        const s_x = SL24hours[hr].normal;

        alpha = r_x + a_x * W;
        beta = s_x + (1 - a_x) * W;
        SL24hours[hr].belief = r_x / (r_x + s_x + W);
        SL24hours[hr].disbelief = s_x / (r_x + s_x + W);
        SL24hours[hr].uncertainty = W / (r_x + s_x + W);

        // P(x) = b_x + a_x * u_x
        SL24hours[hr].projected_probability = SL24hours[hr].belief + a_x * SL24hours[hr].uncertainty;

        a_x = alpha / (alpha + beta); // update a_x (base rate) for next computation

        // console.log(SL24hours[hr].projected_probability, SL24hours[hr].belief);
    }
}

/**
 * Analyze HPCP data and create charts
 * @param rawHPCPData
 */
function analyzeHPCPAnalyzeData(rawHPCPData)
{
    const IETDhour = document.getElementById("ietd").value;

    // temporary save for future use
    g_RawHPCPData = rawHPCPData;

    // run IETD analysis
    g_AnalyzedIETDData = IETDAnalysis(IETDhour, rawHPCPData);

    // create all charts
    createAllCharts(IETDhour, rawHPCPData, g_AnalyzedIETDData);

    const IETDHour_text = 'IETD=' + IETDhour + ' ' + ((IETDhour > 1)?'hours':'hour');

    // show label
    document.getElementById("ietdtitle").innerHTML = "IETD Analysis - Analyzing Independent Precipitation Events (<span style='color:red'>"
        + IETDHour_text +"</span>)";
}

$(document).ready(function() {
    document.addEventListener('keydown', (event)=> {
        if (event.key === 'Control') {
            // the following zooming is used when the user initiate Ctrl+mouse left click to show the actual location in the precipitation line graphs
            g_ZoomingEnabled = true;
        }
    });

    document.addEventListener('keyup', (event)=> {

        if (g_ZoomingEnabled === true && g_PreviousTimeRangeWhenZoomingActivated.length > 0) {
            // the following zooming is used when the user initiate Ctrl+mouse left click to show the actual location in the precipitation line graphs

            // removeHighlights_in_allHighcharts(); // deactivate highlighting

            HichartZooming(g_PreviousTimeRangeWhenZoomingActivated[0], g_PreviousTimeRangeWhenZoomingActivated[1]);

            redrawHighlights_in_allHighcharts();    // redraw highlighted region based on current display.

            g_PreviousTimeRangeWhenZoomingActivated = []; // reset zooming date
            g_ZoomingEnabled = false;
        }
    });

    g_DatePicker_beginningdate = new tempusDominus
        .TempusDominus(document.getElementById('beginningdate'), {
            display: {
                components: {
                    clock: false
                }
            },
            localization: {
                format: 'yyyy-MM-dd'
            }
        });

    g_DatePicker_endingdate = new tempusDominus
        .TempusDominus(document.getElementById('endingdate'), {
            display: {
                components: {
                    clock: false
                }
            },
            localization: {
                format: 'yyyy-MM-dd'
            }
        });

    $("#beginningdate").on("change", function (e) {
        if (document.getElementById("state").value === "") {
            document.getElementById("beginningdate").value = "";
            document.getElementById("endingdate").value = "";
            document.getElementById("state").focus();
            Swal.fire({title:"Oops...", text:"State needs to be selected first!!", icon:"error"});
            return false;
        }
        if (document.getElementById("station").value === "") {
            document.getElementById("beginningdate").value = "";
            document.getElementById("endingdate").value = "";
            document.getElementById("station").focus();
            Swal.fire({title:"Oops...", text:"Station needs to be selected first!!", icon:"error"});
            return false;
        }
        g_DatePicker_endingdate.updateOptions({
            restrictions: {
                minDate: new Date($(this).val())
            }
        });
    });

    $("#endingdate").on("dp.change", function (e) {
        if (document.getElementById("state").value === "") {
            document.getElementById("beginningdate").value = "";
            document.getElementById("endingdate").value = "";
            document.getElementById("state").focus();
            Swal.fire({title:"Oops...", text:"State needs to be selected first!!", icon:"error"});
            return false;
        }
        if (document.getElementById("station").value === "") {
            document.getElementById("beginningdate").value = "";
            document.getElementById("endingdate").value = "";
            document.getElementById("station").focus();
            Swal.fire({title:"Oops...", text:"Station needs to be selected first!!", icon:"error"});
            return false;
        }
        g_DatePicker_beginningdate.updateOptions({
            restrictions: {
                maxDate: new Date($(this).val())
            }
        });
    });

    g_DataTable_HPCP_SUM = $("#precipitationdata_sum").DataTable({
        dom: 'Bfrtip',
        iDisplayLength: 5,
        lengthChange: false,
        buttons: [
            'csv'
        ],
        // "oLanguage": {"sInfoFiltered": ""},
        // "order": [[ 0, 'asc' ]],
        // "fnDrawCallback": function() {
        // 	$('#precipitationdata_sum tr td:nth-child(1)').css('text-align', 'center');
        // 	$('#precipitationdata_sum tr td:nth-child(2)').css('text-align', 'center');
        //     $('#precipitationdata_sum tr td:nth-child(3)').css('text-align', 'center');
        //     $('#precipitationdata_sum tr td:nth-child(4)').css('text-align', 'center');
        // },
        // "columnDefs": [ {
        // 	"targets"  : 'no-sort',
        // 	"orderable": false,
        // }]

        "fnInitComplete": function(oSettings, json) {
            // Add "Clear Filter" button to Filter
            const btnClear = $('<button class="btnClearDataTableFilter" style="height:26px;">CLEAR</button>');
            btnClear.appendTo($('#' + oSettings.sTableId).parents('.dataTables_wrapper').find('.dataTables_filter'));
            $('#' + oSettings.sTableId + '_wrapper .btnClearDataTableFilter').click(function () {
                $('#' + oSettings.sTableId).dataTable().fnFilter('');
            });
        },
    });

} );
