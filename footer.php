
<!-- Scroll to Top Button-->
<a class="scroll-to-top rounded" href="#page-top">
    <i class="fas fa-angle-up"></i>
</a>

<script src="./toolbox/jquery-easing/jquery.easing.min.js"></script>
<script src="./toolbox/sb-admin/sb-admin-2.js"></script>
<script>$(".sidebar").addClass("toggled");</script>

<!-- Footer -->
<footer class="sticky-footer bg-white">
    <div class="container my-auto">
        <div class="copyright text-center my-auto">
            <span lang=EN-US style='font-size:8.0pt;font-family:Arial;color:#000000; text-shadow: 2px 2px 4px #FFFFFF;'>
                University of the District of Columbia<br/>
                4200 Connecticut Avenue NW | Washington, DC 20008 | 202.274.5000<br/>
                <div class="license-container" style="display: inline-block; position: relative;">
                    <span class="license-hover">
                        Copyright &copy; 2023~<?php echo(date("Y",time()));?> Released under the MIT License
                    </span>
                    <div class="license-tooltip">
                        MIT License<br><br>
                        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br><br>
                        The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.<br><br>
                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
                    </div>
                </div>
            </span>
        </div>
    </div>

    <style>
        .license-container {
            cursor: help;
        }

        .license-tooltip {
            display: none;
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            padding: 10px;
            background: #333;
            color: white;
            border-radius: 6px;
            font-size: 8pt;
            text-align: left;
            line-height: 1.4;
            margin-bottom: 10px;
            z-index: 1000;
        }

        .license-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #333 transparent transparent transparent;
        }

        .license-container:hover .license-tooltip {
            display: block;
        }
    </style>
</footer>
<!-- End of Footer -->


</body>
</html>

