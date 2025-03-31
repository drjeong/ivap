<script  class="init">
    let DataTable_UserAccounts = null;

    function CheckedItemUpdate(UserIdx, Option, Checked)
    {
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp=new XMLHttpRequest();
        } else { // code for IE6, IE5
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange=function() {
            if (xmlhttp.readyState==4 && xmlhttp.status==200) {
                switch(xmlhttp.responseText.trim())
                {
                    case "0x11111111":
                        Swal.fire({title: "Updated!", text: "Access privilege has been changed!", timer:2000, icon: "success"});
                        break;
                    default:
                        Swal.fire({title:"ERROR", text: "Unexpected error found. Please contact the system administrator!", icon:"error"});
                }
                DataTable_UserAccounts.ajax.reload(null, false);
            }
        }
        xmlhttp.open("GET","useraccounts_checked.php?id="+encodeURIComponent(UserIdx)
            +"&option="+encodeURIComponent(Option)
            +"&checked="+encodeURIComponent(Checked)
            ,true);
        xmlhttp.send();
    }

    $(document).ready(function() {
        DataTable_UserAccounts = $("#useraccounts").DataTable({
            "processing": true,
            "serverSide": true,
            "lengthMenu": [ 30, 50, 100, 500],
            "ajax": "ssps/ssps_useraccounts.php",
            "order": [[ 1, 'asc' ]],
            "fnDrawCallback": function() {
                $('#useraccounts tr td:nth-child(1)').css('text-align', 'center');
                $('#useraccounts tr td:nth-child(2)').css('text-align', 'center');
                $('#useraccounts tr td:nth-child(3)').css('text-align', 'center');
                $('#useraccounts tr td:nth-child(4)').css('text-align', 'center');
                $('#useraccounts tr td:nth-child(5)').css('text-align', 'center');
            },
            "columns": [
                { "data": 'Email' },
                { "data": 'NAME' },
                { "data": 'Affiliation' },
                { "data": 'Privilege1' },
                { "data": 'Active' },
                { "data": 'Date' }
            ],
            "columnDefs": [
                {
                    "targets"  : 'no-sort',
                    "orderable": false,
                },
                {
                    "render": function ( data, type, row ) {
                        if (data == "1")
                            return '<input value="SysAdmin" id="SysAdmin" type="checkbox" checked/ >'; // checked
                        return '<input value="SysAdmin" id="SysAdmin" type="checkbox" / >';
                    },
                    "targets": 3
                },
                {
                    "render": function ( data, type, row ) {
                        if (data == "1")
                            return '<input value="AccessEnabled" id="AccessEnabled" type="checkbox" checked/ >'; // checked
                        return '<input value="AccessEnabled" id="AccessEnabled" type="checkbox" / >';
                    },
                    "targets": 4
                }],
            buttons: [ {
                extend: 'excelHtml5',
                title: 'Hourly Precipitation'
            }]
        });


        $('#useraccounts').on( 'click', '#SysAdmin', function (e) {
            const data = DataTable_UserAccounts.row( $(this).parents('tr') ).data();
            CheckedItemUpdate(data.Idx, this.value, this.checked);
            return false;
        } );

        $('#useraccounts').on( 'click', '#AccessEnabled', function (e) {
            const data = DataTable_UserAccounts.row( $(this).parents('tr') ).data();
            CheckedItemUpdate(data.Idx, this.value, this.checked);
            return false;
        } );


    } );
</script>

<div class="pagebacklayout_inner_noborder" style="min-height:400px">
    <table style="width:100%; padding: 0; border-spacing:0; margin-bottom:0.1in;">
        <tr>
            <td width="50%">
            </td>
            <td width="50%" align="right">
            </td>
        </tr>
    </table>
    <div class="CSSTable_SSPSLIST">
        <table id="useraccounts" class="display" style="width:100%; padding: 0; border-spacing:0;">
            <thead>
            <tr>
                <th>EMAIL</th>
                <th>NAME</th>
                <th>Affiliation</th>
                <th>Admin Privilege</th>
                <th>Active</th>
                <th>Registered Date</th>
            </tr>
            </thead>
        </table>
    </div>
</div>
