
<?php if ($_SESSION['LOGIN_PRIVILEGE']&128) { ?>
<script type="text/javascript">
function UpdateSummaryDataNotify()
{
    Swal.fire({
        title: "Notice!!",
        text: "Data updating takes several minutes!! Refresh the webpage after ten minutes!!",
        icon: "warning"
    }).then(function(result){
        UpdateSummaryData()
    });
}

function UpdateSummaryData()
{
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
//			if (xmlhttp.responseText.trim() == "0x11111111")
//			{
//				DataTable_Data.ajax.reload();
//				Swal.fire({title:"Updated!!", text: "Data updating has completed!!", icon:"sucess"});
//			}
        }
    }
    xmlhttp.open("GET","precipitationhourlydata_updatesummary_launch.php",true);
    xmlhttp.send();
}

function UploadHPCPData()
{
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            const div = document.getElementById('data_uploading_notice');
            if (xmlhttp.responseText.trim() == "0x10001029")
            {
                Swal.fire({
                    title:"Oops...",
                    text:"Data uploading is in progress. Please wait until the uploading is completed!!",
                    icon:"error"
                });
            }
            else
            {
                UploadHPCPDataForm();
            }
        }
    }
    xmlhttp.open("GET","data_uploadingcheck.php",true);
    xmlhttp.send();
}


function UploadData_Perform()
{
    ($("body")).addClass("loading");
    $.get("/mockjax"); // initiate loading spinner

    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            ($("body")).removeClass("loading");
            switch(xmlhttp.responseText.trim())
            {
                case"0x11111111": {
                    Swal.fire({
                        icon: 'success',
                        title: "UPLOADING",
                        text: "Data uploading is in progress!",
                        timer: 5000
                    }).then((result) => {
                        location.reload();
                    });
                    break;
                }
                case "0x3034203":
                case "0x3030204": {
                    Swal.fire({
                        icon: 'error',
                        title: "ERROR",
                        text: "Some data files are unknown data format!",
                        timer: 5000
                    }).then((result) => {
                        location.reload();
                    });
                    break;
                }
                default:{
                    Swal.fire({title:"ERROR", text: "Unexpected error found. Please contact the system administrator!", icon:"error"});
                    break;
                }
            }
        }
    }

    const formData = new FormData(document.forms.namedItem("popupfrm"));
    xmlhttp.open("POST", "upload_HPCPdata.php", true);
    xmlhttp.send(formData);
}

function UploadHPCPDataForm()
{
    const content = ''
        + '<form enctype="multipart/form-data" name="popupfrm" id="popupfrm">'
        + '<table style="width:100%;">'
        + '<tr><td colspan="2"><div class="input-group" style="width:100%">'
        + ' <div class="input-group" style="width:100%"><span class="input-group-addon" style="width:80px;">Data<span style="color:red">*</span></span>'
        + ' <input type="file" name="uploadFiles[]" id="uploadFiles" class="input-sm form-control" placeholder="Select Data File" accept=".csv" multiple required>'
        + ' </div>'
        + '</div></td></tr>'
        + '</table></form>';

    Swal.fire({
        title: '<i class="fas fa-upload"></i>&nbsp;<span style="font-size:16pt;font-weight: bold;">UPLOAD HPD</span>',
        html: content,
        // icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Upload Now'
    }).then((result) => {
        if (result.isConfirmed) {
            if (popupfrm.uploadFiles.files.length == 0)
            {
                popupfrm.uploadFiles.focus();
                Swal.fire({title:"ERROR", text: "File is not selected!!", icon:"error"});
                return false;
            }
            UploadData_Perform();
        }
    })

    return;


    let dialog = bootbox.dialog({
        title: '<span class="glyphicon glyphicon-edit" style="font-size:20pt;color:#C9DAE1;vertical-align:top;"></span>&nbsp;<span style="font-size:16pt;font-weight: bold;">UPLOAD DATA</span>',
        message: content,
        onEscape: true,
        buttons: {
            ok: {
                label: "<span class='glyphicon glyphicon-ok'></span> UPLOAD",
                className: 'btn-success',
                callback: function(){
                    if (popupfrm.uploadFiles.files.length == 0)
                    {
                        popupfrm.uploadFiles.focus();
                        Swal.fire({title:"ERROR", text: "File is not entered!!", icon:"error"});
                        return false;
                    }
                    UploadData_Perform();
                }
            },
            cancel: {
                label: "<span class='glyphicon glyphicon-remove'></span> CANCEL",
                className: 'btn-default',
                callback: function(){
                }
            }
        }
    }).on('shown.bs.modal',function(){
        $("#uploadFiles").focus();
    }).find('.modal-content').css({
        'margin-top': function (){
            const w = $( window ).height();
            const b = $(this).height();
            let h = (w-b)*0.33;
            return h+"px";
        }
    });
}

</script>
<?php }?>


<script  class="init">
$(document).ready(function() {
	DataTable_Data = $("#precipitationdata").DataTable({
        "dom": 'Blfrtip', // showing Excel button at the beginning with "B"
		"processing": true,
		"serverSide": false,
        "lengthMenu": [ 30, 50, 100, 500, 1000, 2000, 4000, 8000],
		"ajax": "ssps/ssps_stations_summary.php",
		"order": [[ 1, 'asc' ]],
		"fnDrawCallback": function() {
			$('#precipitationdata tr td:nth-child(1)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(2)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(3)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(4)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(5)').css('text-align', 'center');
			$('#precipitationdata tr td:nth-child(6)').css('text-align', 'center');
            $('#precipitationdata tr td:nth-child(7)').css('text-align', 'center');
            $('#precipitationdata tr td:nth-child(8)').css('text-align', 'center');
            $('#precipitationdata tr td:nth-child(9)').css('text-align', 'center');
		},
		"columns": [
            { "data": 'COOP_ID' },
            { "data": 'NCDC_ID' },
            { "data": 'WBAN_ID' },
            { "data": 'NAME' },
            { "data": 'ST' },
            { "data": 'BEG_DT' },
            { "data": 'END_DT' },
            { "data": 'ABEG_DT' },
            { "data": 'AEND_DT' }
		],
		"columnDefs": [ {
			"targets"  : 'no-sort',
			"orderable": false,
		}],
        buttons: [ {
            extend: 'excelHtml5',
            title: 'Hourly Precipitation'
        }]
	});


	// Setup - add a text input to each footer cell
	$('#precipitationdata tfoot th').each( function () {
        var title = $(this).text();
		if (title != "") $(this).html( '<input type="text" placeholder="Search '+title+'" style="color:black; width: 100%;padding:1px;box-sizing: border-box;"/>' );
    } );

	// Apply the search
    DataTable_Data.columns().every( function () {
		var that = this;

		$( 'input', this.footer() ).on( 'keyup change', function () {
			if ( that.search() !== this.value ) {
				that
					.search( this.value )
					.draw();
			}
		});
	} );
} );
</script>


	<div class="pagebacklayout_inner_noborder" style="min-height:400px">
		<table style="width:100%; margin-bottom:0.1in;">
		<tr>
			<td style="width:50%;"></td>
			<td style="width:50%; text-align: right">
                <?php
                if ($_SESSION['LOGIN_PRIVILEGE']&128) {
                    // allowed only to the users who have admin privileges
                ?>&nbsp;
<!--                    <button class="btn btn-info btn-sm" onclick="UploadHPCPData();return false;"><i class="fas fa-upload"></i> UPLOAD DATA</button>&nbsp;-->
<!--                    <button class="btn btn-info btn-sm" onclick="javascript:location.href='dataupload_logs.php';return false;"><i class="fas fa-list"></i> UPLOAD HISTORY</button>&nbsp;-->
<!--                    <button class="btn btn-info btn-sm" onclick="UpdateSummaryDataNotify();return false;">UPDATE DATA SUMMARY</button>-->
                    <?php
                }
                ?>
            </td>
		</tr>
		</table>
		<div class="CSSTable_SSPSLIST">
			<table id="precipitationdata" class="display" cellspacing="0" width="100%">
			<thead>
				<tr>
                    <th>COOP_ID</th>
                    <th>NCDC_ID</th>
                    <th>WBAN_ID</th>
                    <th>NAME</th>
                    <th>ST</th>
                    <th>BEG_DT</th>
                    <th>END_DT</th>
                    <th>ACTUAL BEG_DT</th>
                    <th>ACTUAL END_DT</th>
				</tr>
			</thead>
			<tfoot>
				<tr>
                    <th>COOP_ID</th>
                    <th>NCDC_ID</th>
                    <th>WBAN_ID</th>
                    <th>NAME</th>
                    <th>ST</th>
                    <th>BEG_DT</th>
                    <th>END_DT</th>
                    <th>ACTUAL BEG_DT</th>
                    <th>ACTUAL END_DT</th>
				</tr>
			</tfoot>
			</table>
		</div>
	</div>
