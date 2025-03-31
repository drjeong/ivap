/**
 * Title: IETD analysis multiple stations
 *
 * @type {null}
 */

let g_DataTable_HPCP_SUM = null;
let g_olMap = null;   // maps for selected stations
let olMap2 = null;  // maps for added stations
let g_DatePicker_beginningdate = null;
let g_DatePicker_endingdate = null;
let g_ZoomingEnabled = false;   // check if zooming is enabled or not
let g_AnalyzedIETDData = {};
let g_AnalyzedIETDStations = {};

let g_plotTrendAnalysis = null;
let g_plotAnnualPCA = null;
let g_plotMonthlyPrecipitation = null;

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
        if (g_plotTrendAnalysis) g_plotTrendAnalysis.resize();
        if (g_plotAnnualPCA) g_plotAnnualPCA.resize();
        if (g_plotMonthlyPrecipitation) g_plotMonthlyPrecipitation.resize();

    } else {
        document.getElementById(div).style.display = "none";
    }
}


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
 * Format parameters to be used in data fetching
 * @returns {string}
 */
function getParams() {
    const selectedStations = document.getElementById("selectedstations");

    // Get all stations data in one pass
    const stationData = Array.from(selectedStations.options).map(option => ({
        id: option.value.split('[')[0].trim(),
        state: option.text.split(':')[0]
    }));

    // Join arrays with '|' delimiter
    const selectedStationIds = stationData.map(station => station.id).join('|');
    const selectedStationsStates = stationData.map(station => station.state).join('|');

    // Create URL parameters object
    const params = {
        states: selectedStationsStates,
        stations: selectedStationIds,
        ietd: document.getElementById("ietd").value,
        from: document.getElementById("beginningdate").value,
        to: document.getElementById("endingdate").value
    };

    // Build query string with encoded values
    return Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
}

// function downloadOriginalHP()
// {
//     if (validateForm() === false) return;
//
//     const param = getParams();
//
//     ($("body")).addClass("loading");
//     $.get("/mockjax"); // initiate loading spinner
//     window.location = 'ietdanalysis_ms_dndata.php?'+param;
//     ($("body")).removeClass("loading");
// }


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
        const response = await fetch('ietdanalysis_ms_dndata.php?' + param);

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
        //         downloadFrame.src = 'ietdanalysis_ms_dndata.php?' + param;
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


function runIETDAnalysis() {
    if (validateForm() === false) return;

    // Show full-page spinner at the beginning
    showFullPageSpinner();

    try {
        // if charts exist, destroy all charts
        destroyAllCharts();
        removeAllCharts();

        const param = getParams();

        // Use a Promise to handle the AJAX request
        const dataPromise = new Promise((resolve, reject) => {
            $.getJSON('ietdanalysis_ms_data.php?callback=?&' + param)
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
 * Destroy All Charts
 */
function destroyAllCharts()
{
    // Destroy existing plot if it exists
    if (g_plotTrendAnalysis) {
        g_plotTrendAnalysis.destroy();
        g_plotTrendAnalysis = null;
    }
    if (g_plotAnnualPCA) {
        g_plotAnnualPCA.destroy();
        g_plotAnnualPCA = null;
    }
    if (g_plotMonthlyPrecipitation) {
        g_plotMonthlyPrecipitation.destroy();
        g_plotMonthlyPrecipitation = null;
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
        document.getElementById("div_charts01").style.display = "block";
        document.getElementById("div_charts02").style.display = "block";
        document.getElementById("div_charts03").style.display = "block";

        document.getElementById("dnietddata").style.display = "block";
        document.getElementById("dnrawdata").style.display = "block";

    }
    else
    {
        // hide all charts and buttons
        document.getElementById("div_chart_hpcp_hourlydata").style.display = "none";
        document.getElementById("div_charts01").style.display = "none";
        document.getElementById("div_charts02").style.display = "none";
        document.getElementById("div_charts03").style.display = "none";

        document.getElementById("dnietddata").style.display = "none";
        document.getElementById("dnrawdata").style.display = "none";

        resetInputs();
    }
}


function resetInputs()
{
    g_DataTable_HPCP_SUM.clear().draw();
    document.getElementById("avdatafrom").value = '';
    document.getElementById("avdatato").value = '';
    document.getElementById("beginningdate").value = '';
    document.getElementById("endingdate").value = '';
    // document.getElementById("ietd").value = '';
}

function validateForm()
{
    const selectedStations = document.getElementById("selectedstations");
    if (selectedStations.length == 0) {
        Swal.fire({title:"Oops...", text:"Station needs to be selected!!", icon:"error"});
        return false;
    }
    if (selectedStations.length > 6) {
        Swal.fire({title:"Oops...", text:"Selected stations must be less than 6!!", icon:"error"});
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

function changeState(state)
{
    // remove station list
    let selectcomboBox = document.getElementById("station");
    while (selectcomboBox.options.length > 0) {
        selectcomboBox.remove(0);
    }

    // remove station list per state
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState===4 && xmlhttp.status===200) {
            let obj = JSON.parse(xmlhttp.responseText.trim());
            if (obj != null)
            {
                for (let i=0; i<obj.length; i++) {
                    let option = document.createElement("option");
                    option.value = obj[i].IDX + " [" + obj[i].LON + "," + obj[i].LAT + "]";
                    option.text = obj[i].NAME + " (" + obj[i].BEG_DT + "~" + obj[i].END_DT + ")";
                    option.NCDC_ID = obj[i].NCDC_ID;
                    option.COOP_ID = obj[i].COOP_ID;
                    option.GHCND_ID = obj[i].GHCND_ID;
                    option.FAA_ID = obj[i].FAA_ID;
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
    xmlhttp.open("GET", "get_hourlydata_stationlistdetail.php?"+param, true);
    xmlhttp.send();
}

function getMoment(strDate)
{
    let datetime = strDate.split(" ");
    let date = datetime[0].split("-");
    // let time = datetime[1].split(":");
    date[1] = date[1] - 1; // convert to javascript month : beginning with 0 for January to 11 for December

    // let momentDate = moment([date[0], date[1], date[2], time[0], time[1], time[2], 0]);
    let momentDate = moment([date[0], date[1], date[2], 0, 0, 0, 0]);

    return momentDate;
}

function formatDate(date)
{
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

    if (month.length < 2)
    month = '0' + month;
    if (day.length < 2)
    day = '0' + day;

    return [year, month, day].join('-');
}

function updateStationsDataPeriod()
{
    const selectedStations = document.getElementById("selectedstations");
    let datePeriod = [null, null];  // From & To dates
    for(let i=0; i<selectedStations.options.length; i++)
    {
        // const stationid = selectedStations.options[i].value;
        const stationtext = selectedStations.options[i].text;

        const regexDates = /\((\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})\)/;
        const DatesPeriod = stationtext.match(regexDates);
        const fromTime = (new Date(DatesPeriod[1])).getTime();
        const toTime = (new Date(DatesPeriod[2])).getTime();

        if (datePeriod[0] == null)
        {
            datePeriod[0] = fromTime;
            datePeriod[1] = toTime;
        }
        else
        {
            datePeriod[0] = Math.min(datePeriod[0], fromTime);
            datePeriod[1] = Math.max(datePeriod[1], toTime);
        }
    }


    let DataFrom = null;
    let DataTo = null;
    if (datePeriod[0] != null && datePeriod[1] != null )
    {
        DataFrom = formatDate(timeConverter(datePeriod[0]));
        DataTo = formatDate(timeConverter(datePeriod[1]));
        setCalendarRange(DataFrom, DataTo)
    }

    document.getElementById("avdatafrom").value = DataFrom;
    document.getElementById("avdatato").value = DataTo;
    document.getElementById("beginningdate").value = DataFrom;
    document.getElementById("endingdate").value = DataTo;

    return 0;
}

function setCalendarRange(DataFrom, DataTo)
{
    const DateFrom = getMoment(DataFrom);
    const DateTo = getMoment(DataTo);

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

function checkIfOptionExist(selectId, itemValue)
{
    let selectOption =  document.getElementById(selectId).options;
    for(let i = 0; i < selectOption.length; i++)
    {
        if( selectOption[i].value === itemValue )
        return true;
    }
    return false;
}

function resetAll()
{
    showAllCharts(false);

    removeAllCharts();
    resetInputs();
}

function removeSelectedStation()
{
    resetAll();

    $('#selectedstations option:selected').remove();

    olRemoveAllMarkers(olMap2);

    // add markers
    const selected = document.querySelectorAll('#selectedstations option');
    const values = Array.from(selected).map(el => el.value);
    const texts = Array.from(selected).map(el => el.text);
    for (let i=0; i<texts.length; i++) {
        let stationid = values[i];
        let stationtext = texts[i];
        stationtext = (stationtext.split(":")[1]).trim();
        const label = (stationtext.split("[")[0]).trim();
        const regexLonLat = /\[(.+),(.+)\]/;
        const LonLat = stationid.match(regexLonLat);
        olAddNewMarker(olMap2, LonLat[1], LonLat[2], label);
    }
    updateStationsDataPeriod();

    if (texts.length === 0) {
        olMove2USCenter(olMap2);
    }
}


/**
 * Add selected station to the selected station list
 */
function addSelectedStation()
{
    resetAll();

    // find selected stations
    const stationSelect = document.getElementById('station');
    const selectedStationsSelect = document.getElementById('selectedstations');
    const state = document.getElementById('state').value;

    // Convert selected options to array and extract data
    const selectedOptions = Array.from(stationSelect.selectedOptions);

    selectedOptions.forEach(option => {
        const stationId = option.value;
        const stationName = `${state}:${option.text}`;

        // Skip if station already exists in target
        if (checkIfOptionExist('selectedstations', stationId)) {
            return;
        }

        // Create new option
        const newOption = new Option(stationName, stationId);

        // Copy additional properties
        newOption.COOP_ID = option.COOP_ID;
        newOption.FAA_ID = option.FAA_ID;
        newOption.GHCND_ID = option.GHCND_ID;
        newOption.NCDC_ID = option.NCDC_ID;

        // Add to selectedstations
        selectedStationsSelect.add(newOption);

        // Extract coordinates and add marker
        try {
            const label = stationName.split('[')[0].trim();
            const [, lon, lat] = stationId.match(/\[(.+),(.+)\]/) || [];

            if (lon && lat) {
                olAddNewMarker(olMap2, lon, lat, label);
            } else {
                console.warn(`Invalid coordinates for station: ${stationId}`);
            }
        } catch (error) {
            console.error(`Error processing station ${stationId}:`, error);
        }
    });

    // update date period
    let rtn_station_id = null;
    while (rtn_station_id = updateStationsDataPeriod() && rtn_station_id > 0)
    {
        const selected_object = document.getElementById("selectedstations");
        for (let i=0; i<selected_object.length; i++) {
            if (selected_object.options[i].value === rtn_station_id)
            selected_object.remove(i);
        }
    }
}

/**
 * Show Station on a Map
 * @constructor
 */
function ShowStationOnMap() {
    const stationSelect = document.getElementById('station');
    const selectedOptions = Array.from(stationSelect.selectedOptions);

    // Clear existing markers
    olRemoveAllMarkers(g_olMap);

    // Process each selected station
    selectedOptions.forEach(option => {
        try {
            const stationId = option.value;
            const stationName = option.text;
            const label = stationName.split('[')[0].trim();

            // Extract coordinates
            const [, lon, lat] = stationId.match(/\[(.+),(.+)\]/) || [];

            if (lon && lat) {
                // Add marker and center map
                olAddNewMarker(g_olMap, lon, lat, label);
                olMove2NewMapPosition(g_olMap, lon, lat);
            } else {
                console.warn(`Invalid coordinates for station: ${stationId}`);
            }
        } catch (error) {
            console.error('Error processing station:', error);
        }
    });
}

function isObject(obj) {
    return obj && typeof obj === 'object';
}

/**
 * Remove all highcharts
 */
function removeAllCharts()
{
    removeAllHighCharts();
    $('#chart_hpcp_hourlydata').empty();
}

function getStationInfo(station) {
    const selectedStations = document.getElementById("selectedstations");

    // Find matching station
    const option = Array.from(selectedStations.options).find(opt => {
        const stationId = parseInt(opt.value.split('[')[0].trim());
        return stationId === station;
    });

    if (!option) {
        return {
            id: null,
            name: '',
            COOP_ID: null,
            FAA_ID: null,
            GHCND_ID: null,
            NCDC_ID: null
        };
    }

    const name = option.text.split('(')[0].trim();
    const sname = `${name.split(":")[0]} [${station}]`;

    return {
        id: station,
        name: name,
        sname: sname,
        COOP_ID: option.COOP_ID,
        FAA_ID: option.FAA_ID,
        GHCND_ID: option.GHCND_ID,
        NCDC_ID: option.NCDC_ID
    };
}

function createTooltipText(station) {
    let parts = [];
    parts.push(`ID: ${station.id}`);
    if (station.FAA_ID !== null) {
        parts.push(`FAA: ${station.FAA_ID}`);
    }
    if (station.NCDC_ID !== null) {
        parts.push(`NCDC: ${station.NCDC_ID}`);
    }
    if (station.GHCND_ID !== null) {
        parts.push(`GHCND: ${station.GHCND_ID}`);
    }
    if (station.COOP_ID !== null) {
        parts.push(`COOP: ${station.COOP_ID}`);
    }
    return parts.join('<br>'); // Use line breaks for better readability in tooltip
}


function addChart(stationInfo, data, maxprecipitation) {
    const IETDhour = document.getElementById("ietd").value;
    const chartDivId = 'ietd_hpcp_sum' + stationInfo.id;

    const chartDiv = `
        <div class="row mb-4">  <!-- Added margin-bottom -->
            <div class="col-12">
                <div id="${chartDivId}" style="display: block; min-width: 310px; height: 200px; margin: 0 auto"></div>
            </div>
        </div>
    `;

    $('#chart_hpcp_hourlydata').append($(chartDiv));

    const title = `${stationInfo.name} [${stationInfo.id}]`;
    const subtitle = "";
    const tooltip = createTooltipText(stationInfo);
    const label = 'HPCP';

    // create HPD IETD chart
    createChart(chartDivId, title, 'center', subtitle, tooltip, label, data, maxprecipitation);
}

function timeConverter(UNIX_timestamp){
    let date = new Date(UNIX_timestamp).toISOString().substr(0, 19).replace('T', ' ');
    return date;
}

function analyzeHPCPAnalyzeData(data)
{
    // Reset global variable before use
    g_AnalyzedIETDData = {};
    g_AnalyzedIETDStations = {};

    let DataTable_dataSet = [];

    let beginningdate = moment.utc(document.getElementById("beginningdate").value + ' 00:00:00', 'YYYY-MM-DD HH:mm:ss').unix() * 1000;
    let endingdate = moment.utc(document.getElementById("endingdate").value + ' 23:00:00', 'YYYY-MM-DD HH:mm:ss').unix() * 1000;

    // determine max precipitation
    let maxPrecipitation = 0;
    for(let i=0; i<data.length; i++) {
        const station_data = data[i][1];
        for (let j = 0; j < station_data.length; j++) {
            const precipitation = station_data[j][2];
            if (maxPrecipitation < precipitation) maxPrecipitation = precipitation;
        }
    }

    // format chart data
    for(let i=0; i<data.length; i++)
    {
        const station_id = data[i][0];
        const station_data = data[i][1];
        const station_info = getStationInfo(station_id);

        // Add this new array for formatted data
        const formattedData = [];

        const hpcp_analyzeddata_sum = [];
        let prvsFromDate=null, prvsToDate=null;
        for(let j=0; j<station_data.length; j++)
        {
            const crntFromDate = station_data[j][0];
            const crntToDate = station_data[j][1];
            const precipitation = station_data[j][2];
            const count = station_data[j][3];

            // Add this part to create formatted data
            if (precipitation > 0) {
                formattedData.push({
                    dateFrom: crntFromDate,
                    dateTo: crntToDate,
                    volume: precipitation
                });
            }

            // Your existing code continues unchanged
            DataTable_dataSet.push([station_info.name, timeConverter(crntFromDate), timeConverter(crntToDate), precipitation, count]);

            if (j === 0) {
                if (beginningdate < crntFromDate)
                    hpcp_analyzeddata_sum.push([beginningdate, 0]);
            }

            if (prvsToDate !== crntFromDate)
            {
                if (prvsToDate != null)
                {
                    hpcp_analyzeddata_sum.push([prvsToDate, 0]);
                }
                hpcp_analyzeddata_sum.push([crntFromDate, 0]);

                hpcp_analyzeddata_sum.push([crntFromDate, precipitation]);
                hpcp_analyzeddata_sum.push([crntToDate, precipitation]);
            }
            else
            {
                hpcp_analyzeddata_sum.push([crntFromDate, precipitation]);
                hpcp_analyzeddata_sum.push([crntToDate, precipitation]);
            }
            prvsFromDate = crntFromDate;
            prvsToDate = crntToDate;
        }
        if (prvsToDate < endingdate) {
            hpcp_analyzeddata_sum.push([prvsToDate, 0]);
            hpcp_analyzeddata_sum.push([endingdate, 0]);
        }

        addChart(station_info, hpcp_analyzeddata_sum, maxPrecipitation);

        // Change this line to store formattedData instead
        g_AnalyzedIETDData[station_id] = formattedData;
        g_AnalyzedIETDStations[station_id] = station_info;
    }

    g_DataTable_HPCP_SUM.clear();
    g_DataTable_HPCP_SUM.rows.add( DataTable_dataSet ).draw();

    // create all charts
    createAllCharts();

    // document.getElementById("ietdtitle").innerHTML = "Multi-stations IETD Analysis (<span style='color:red'>" + document.getElementById("ietd").value +" hour(s)</span>)";
}


/**
 * Create All Charts
 * @param IETDhour
 * @param rawHPCPData
 * @param ietdata
 */
function createAllCharts(IETDData)
{
    const IETDhour = document.getElementById("ietd").value;

    // destroy all charts
    destroyAllCharts();

    // create all charts
    g_plotTrendAnalysis = new TrendAnalysisPlot('chart_hpcp_trendanalysis', IETDhour, g_AnalyzedIETDData, g_AnalyzedIETDStations);
    g_plotAnnualPCA = new AnnnualPCAPlot('chart_hpcp_annualpca', IETDhour, g_AnalyzedIETDData, g_AnalyzedIETDStations);
    g_plotMonthlyPrecipitation = new MonthlyPrecipitationPlot('chart_hpcp_monthlyprecipitation', g_AnalyzedIETDData, g_AnalyzedIETDStations);

    // // show label
    // document.getElementById("ietdtitle").innerHTML = "IETD Analysis - Analyzing Independent Precipitation Events (<span style='color:red'>"
    //     + document.getElementById("ietd").value +" hour(s)</span>)";
}


$(document).ready(function() {
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
        if (document.getElementById("state").value == "") {
            document.getElementById("beginningdate").value = "";
            document.getElementById("endingdate").value = "";
            document.getElementById("state").focus();
            Swal.fire({title:"Oops...", text:"State needs to be selected first!!", icon:"error"});
            return false;
        }
        if (document.getElementById("station").value == "") {
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

    $("#endingdate").on("change", function (e) {
        if (document.getElementById("state").value == "") {
            document.getElementById("beginningdate").value = "";
            document.getElementById("endingdate").value = "";
            document.getElementById("state").focus();
            Swal.fire({title:"Oops...", text:"State needs to be selected first!!", icon:"error"});
            return false;
        }
        if (document.getElementById("station").value == "") {
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
            let btnClear = $('<button class="btnClearDataTableFilter" style="height:26px;">CLEAR</button>');
            btnClear.appendTo($('#' + oSettings.sTableId).parents('.dataTables_wrapper').find('.dataTables_filter'));
            $('#' + oSettings.sTableId + '_wrapper .btnClearDataTableFilter').click(function () {
                $('#' + oSettings.sTableId).dataTable().fnFilter('');
            });
        },
    });

    // Setup - add a text input to each footer cell
    $('#precipitationdata_sum tfoot th').each( function (index, value) {
        let title = $(this).text();
        if (title != '')
            $(this).html( '<input type="text" placeholder="Search '+title+'" value="'+g_DataTable_HPCP_SUM.column(index).search()+'" style="color:black; width: 100%;padding:1px;box-sizing: border-box;"/>' );
    } );

    // Apply the search
    g_DataTable_HPCP_SUM.columns().every( function () {
        let that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value )
                    .draw();
            }
        });
    } );

} );


async function Zoom_based_UpdateCharts(starttime, endtime) {
    // start loading spinner
    const IETDhour = document.getElementById("ietd").value;

    if (starttime !== undefined && endtime !== undefined) {
        // generate data based on the selected start and end time
        let newIETDData = {};

        // iterate through each station's data
        Object.entries(g_AnalyzedIETDData).forEach(([station, eventObjects]) => {
            // Filter event objects for this station
            const filteredEvents = eventObjects.filter(eventObj => {
                return starttime <= eventObj.dateFrom && eventObj.dateTo <= endtime;
            });

            // Only add station data if there are filtered events
            if (filteredEvents.length > 0) {
                newIETDData[station] = filteredEvents;
            }
        });

        // update Precipitation Event Analysis
        if (g_plotTrendAnalysis) g_plotTrendAnalysis.updateData(newIETDData, IETDhour);
        if (g_plotAnnualPCA) g_plotAnnualPCA.updateData(newIETDData, IETDhour);
        if (g_plotMonthlyPrecipitation) g_plotMonthlyPrecipitation.updateData(newIETDData);

    }
    // end loading spinner
}