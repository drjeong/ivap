class FloatingBootboxChart extends ChartCommons{
    constructor(containerId, options = {}) {
        super(containerId);
        this.containerId = containerId;
        // Set defaults and override with provided options
        this.options = {
            dialogSize: 'xl', // sm, lg, xl
            title: 'Chart View',
            ...options
        };
        this.visible = false;

        // this.wrapContainer();
        this.addFloatingButton();
    }

    isFloatingWindowVisible(){
        return this.visible;
    }

    // Get title from child class, with a default value if not set
    getTitle() {
        return this.title || 'Chart View';
    }
    getDialogOptions() {
        return {
            title: `<div class="d-flex align-items-center">
                        <i class="bi bi-graph-up" style="font-size:20pt;color:#C9DAE1;"></i>
                        <span class="ms-2" style="font-size:16pt;font-weight:bold;">${this.getTitle()}</span>
                    </div>`,
            size: this.dialogSize
        };
    }

    wrapContainer() {

        // Remove wrapper and restore original container
        const prev_wrapper = document.querySelector(`.${this.containerId}_chart-flex-wrapper`);
        if (prev_wrapper) {
            const originalContainer = document.getElementById(this.containerId);
            if (originalContainer && prev_wrapper.parentNode) {
                prev_wrapper.parentNode.insertBefore(originalContainer, prev_wrapper);
            }
            prev_wrapper.remove();
        }

        // Get the original container
        const originalContainer = d3.select(`#${this.containerId}`);
        const parent = originalContainer.node().parentNode;

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = `${this.containerId}_chart-flex-wrapper`;

        // Insert wrapper before the original container
        parent.insertBefore(wrapper, originalContainer.node());

        // Move the original container into wrapper
        wrapper.appendChild(originalContainer.node());
    }

    addFloatingButton() {
        // Add the button directly to the D3 container
        const container = d3.select(`#${this.containerId}`);

        this.wrapContainer();

        // Create button using D3
        const button = container.append('div')
            .attr('class', `${this.containerId}_chart-button-container`)
            .append('button')
            .attr('class', `btn btn-primary btn-sm ${this.containerId}_chart-float-button`)
            .on('click', () => this.showDialog());

        button.append('i')
            .attr('class', `bi bi-arrows-fullscreen ${this.containerId}_chart-float-icon`);

        // Add CSS if not already added
        if (!document.getElementById(`${this.containerId}_chart-float-button-style`)) {
            const style = document.createElement('style');
            style.id = `${this.containerId}_chart-float-button-style`;
            style.textContent = `
                .${this.containerId}_chart-flex-wrapper {
                    display: flex;
                    align-items: flex-start;
                    gap: 0;
                    position: relative;
                }
                #${this.containerId} {
                    width: 100%;
                    flex: none;
                    position: relative;  /* Added to make absolute positioning work */
                }
                .${this.containerId}_chart-button-container {
                    position: absolute;
                    left: 40px;
                    top: 0;
                }
                .${this.containerId}_chart-float-button {
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                    min-width: unset;
                    line-height: 1;
                }
                .${this.containerId}_chart-float-button:hover {
                    opacity: 1;
                }
                .${this.containerId}_chart-float-icon {
                    font-size: 10px;
                }
                @media (max-width: 768px) {
                    .${this.containerId}_chart-button-container {
                        display: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }


    showDialog() {
        // Prevent opening multiple instances
        if (this.visible === true) {
            // console.log('Dialog already open, ignoring request');
            return;
        }

        // Clean up any existing dialog before creating a new one
        if (this.currentDialog) {
            this.currentDialog.modal('hide');
            this.currentDialog = null;
        }

        // Remove any orphaned modal-related elements
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('padding-right', '');

        // Remove any existing size selector to prevent ID conflicts
        $(`#chart-scale-${this.containerId}`).remove();

        const floatingContainer = `<div id="floating-${this.containerId}" style="width: 100%; height: 500px;"></div>`;

        const options = this.getDialogOptions();

        // Add custom styles for the modal including new footer layout styles
        const modalStyles = `
        <style>
            /* Modal size presets - apply to modal-dialog with higher specificity */
            .bootbox .modal-dialog.modal-size-small {
                width: 500px !important;
                max-width: 500px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .bootbox .modal-dialog.modal-size-medium {
                width: 800px !important;
                max-width: 800px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .bootbox .modal-dialog.modal-size-large {
                width: 1200px !important;
                max-width: 1200px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .bootbox .modal-dialog.modal-size-xlarge {
                width: 1600px !important;
                max-width: 1600px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .bootbox .modal-dialog.modal-size-fullscreen {
                width: 98% !important;
                max-width: 98% !important;
                height: 95vh !important;
                margin: 10px auto !important;
            }
            .bootbox .modal-dialog.modal-size-fullscreen .modal-content {
                height: 95vh !important;
            }
            .bootbox .modal-dialog.modal-size-fullscreen .modal-body {
                height: calc(95vh - 130px) !important;
                max-height: unset !important;
            }
            .bootbox .modal-dialog.modal-size-fullscreen #floating-${this.containerId} {
                height: calc(95vh - 180px) !important;
            }
            
            /* Custom footer layout styles */
            .bootbox .modal-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
            }
            .bootbox .float-dialog .modal-footer {
                border-top: 1px solid #dee2e6;
            }
            .chart-size-button {
                margin: 0;
                padding: 0 !important;
                background: none !important;
                border: none !important;
                box-shadow: none !important;
            }
            .right-footer-buttons {
                margin-left: auto;
            }
            /* Make sure the size control stays on the left */
            .chart-size-controls {
                margin-right: auto;
            }
            .chart-size-select {
                width: 70px !important;
                height: 28px !important;
                padding: 2px 8px !important;
                font-size: 0.75rem !important;
            }
        </style>
    `;

        // Append styles to head if not already present
        if (!document.getElementById('bootbox-float-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'bootbox-float-styles';
            styleElement.innerHTML = modalStyles;
            document.head.appendChild(styleElement);
        }

        const dialog = bootbox.dialog({
            title: options.title,
            message: floatingContainer,
            size: options.size,
            onEscape: false,
            backdrop: 'static', // only allowed to close when "close" button is clicked
            closeButton: false,
            // We'll customize the footer after dialog creation
            buttons: {
                close: {
                    label: `<i class="bi bi-x-lg"></i> Close`,
                    className: 'btn-secondary',
                    callback: () => {
                        this.moveChartToOriginal();
                        document.activeElement.blur();
                    }
                }
            },
            className: 'float-dialog',
            centerVertical: true,
            attributes: {
                inert: ''
            }
        });

        // Store the bootbox reference
        this.currentDialog = dialog;

        // In your showDialog method, after creating the dialog
        dialog.on('shown.bs.modal', () => {
            // Store original container and dimensions
            this.originalContainer = d3.select(`#${this.containerId}`);
            this.originalWidth = this.width || this.originalContainer.node().offsetWidth;
            this.originalHeight = this.height || this.originalContainer.node().offsetHeight;

            // Set initial size class
            const modalDialog = dialog.find('.modal-dialog');

            // Start with removing any existing size classes
            modalDialog.removeClass('modal-size-small modal-size-medium modal-size-large modal-size-xlarge modal-size-fullscreen');

            // Add the default large size class
            modalDialog.addClass('modal-size-large');

            // Apply direct CSS to ensure the size is applied immediately
            modalDialog.css({
                'width': '1200px',
                'max-width': '1200px',
                'margin-left': 'auto',
                'margin-right': 'auto'
            });

            // Force reflow to ensure styles are applied
            void modalDialog[0].offsetHeight;

            // Set up the size change handler explicitly
            this.setupSizeChangeHandler();

            // Move chart to floating container
            setTimeout(() => {
                this.moveChartToFloat();

                // Add window resize handler
                $(window).off('resize.chartModal').on('resize.chartModal', () => {
                    this.handleResize();
                });

                // Force initial resize to make sure chart fits correctly
                this.handleResize();
            }, 300);
        });

        // After the dialog is created, customize the modal footer
        setTimeout(() => {
            // Create size selector HTML
            const sizeSelector = `
        <div class="chart-size-controls">
            <small class="text-muted me-1">Size:</small>
            <select id="chart-scale-${this.containerId}" class="form-select form-select-sm chart-size-select">
                <option value="small">S</option>
                <option value="medium">M</option>
                <option value="large" selected>L</option>
                <option value="xlarge">XL</option>
                <option value="fullscreen">Full</option>
            </select>
        </div>
    `;

            // Find and customize the modal footer
            const modalFooter = dialog.find('.modal-footer');
            if (modalFooter.length) {
                // Insert the size selector at the beginning of the footer
                modalFooter.prepend(sizeSelector);

                // Wrap close button in a div for positioning
                const closeButton = modalFooter.find('.btn-secondary');
                closeButton.wrap('<div class="right-footer-buttons"></div>');
            }
        }, 100);

        // Make modal draggable
        dialog.find('.modal-content').draggable({
            handle: ".modal-header",
            containment: "document"
        });

        dialog.find('.modal-header').css({
            cursor: 'move'
        });

        // Position the dialog
        dialog.find('.modal-dialog').css({
            'margin-top': function() {
                const w = $(window).height();
                const b = $(this).height();
                const h = Math.max((w-b) * 0.2, 20);
                return h + "px";
            }
        });
    }

    setupSizeChangeHandler() {
        if (!this.currentDialog) {
            console.error('No dialog reference found when setting up size handler');
            return;
        }

        const self = this;
        const selectId = `chart-scale-${this.containerId}`;
        const selectElement = document.getElementById(selectId);

        if (selectElement) {
            // console.log(`Size selector found: #${selectId}`);

            // Remove any existing event listeners to prevent duplicates
            $(selectElement).off('change');

            // Direct DOM event handling for more reliability
            selectElement.addEventListener('change', function(e) {
                const selectedSize = this.value;
                // console.log(`Size change event triggered. Selected: ${selectedSize}`);

                const modalDialog = self.currentDialog.find('.modal-dialog');
                const modalContent = self.currentDialog.find('.modal-content');
                const modalBody = self.currentDialog.find('.modal-body');
                const floatingDiv = self.currentDialog.find(`#floating-${self.containerId}`);

                // Debug current classes
                // console.log(`Current modal classes: ${modalDialog.attr('class')}`);

                // First, reset all modal styling
                modalDialog.css({
                    'width': '',
                    'max-width': '',
                    'height': '',
                    'margin': ''
                });

                modalContent.css('height', '');
                modalBody.css('height', '');
                floatingDiv.css('height', '500px');

                // Remove all size classes
                modalDialog.removeClass('modal-size-small modal-size-medium modal-size-large modal-size-xlarge modal-size-fullscreen');

                // Apply the new size class
                modalDialog.addClass(`modal-size-${selectedSize}`);

                // Define specific size configurations
                const sizes = {
                    'small': { width: '500px', maxWidth: '500px' },
                    'medium': { width: '800px', maxWidth: '800px' },
                    'large': { width: '1200px', maxWidth: '1200px' },
                    'xlarge': { width: '1600px', maxWidth: '1600px' },
                    'fullscreen': { width: '98%', maxWidth: '98%', height: '95vh' }
                };

                // Apply the correct size directly to elements
                if (sizes[selectedSize]) {
                    // console.log(`Applying size: ${selectedSize}`);

                    // Apply styles directly to modal dialog with !important flag
                    modalDialog.attr('style', `
                    width: ${sizes[selectedSize].width} !important; 
                    max-width: ${sizes[selectedSize].maxWidth} !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                `);

                    // Special handling for fullscreen mode
                    if (selectedSize === 'fullscreen') {
                        modalContent.css('height', '95vh');
                        modalBody.css('height', 'calc(95vh - 130px)');
                        floatingDiv.css('height', 'calc(95vh - 180px)');
                        modalDialog.css('margin', '10px auto');
                    } else {
                        // For non-fullscreen, set default heights and adjust margins for vertical centering
                        modalDialog.css({
                            'margin-top': function() {
                                const w = $(window).height();
                                const b = $(this).height();
                                const h = Math.max((w-b) * 0.2, 20);
                                return h + "px";
                            }
                        });
                    }

                    // Force reflow to ensure styles are applied
                    void modalDialog[0].offsetHeight;

                    // Center the modal after size change
                    if (self.currentDialog) {
                        self.currentDialog.modal('handleUpdate');
                    }

                    // Important: After a short delay, update the chart size
                    setTimeout(() => {
                        // console.log('Updating chart after size change');

                        // Get the new dimensions of the floating container
                        const newRect = floatingDiv[0].getBoundingClientRect();
                        // console.log(`New container dimensions: ${newRect.width}x${newRect.height}`);

                        // Update chart with new dimensions
                        self.width = newRect.width;
                        self.height = newRect.height;
                        self.handleResize();
                    }, 300);
                }
            });

            // Add click event handler to ensure it's not being intercepted
            $(selectElement).on('click', function(e) {
                // console.log('Select element clicked');
                e.stopPropagation();
            });
        } else {
            console.error(`Size select element not found: chart-scale-${this.containerId}`);
        }
    }

    moveChartToFloat() {
        try {
            this.visible = true;

            // Store original container
            this.originalContainer = d3.select(`#${this.containerId}`);

            // Store original dimensions before moving
            const containerStyle = window.getComputedStyle(this.originalContainer.node());
            this.originalWidth = parseInt(containerStyle.width);
            this.originalHeight = parseInt(containerStyle.height);

            // console.log(`Stored original dimensions: ${this.originalWidth}x${this.originalHeight}`);

            // Hide the original selectors when moved to floating container
            this.originalContainer.selectAll(".error_bars_selector-container, .year-selector-container")
                .style("visibility", "hidden");

            // Get the floating container
            const floatingContainer = d3.select(`#floating-${this.containerId}`);
            if (!floatingContainer.node()) {
                console.error('Floating container not found');
                return;
            }

            // IMPORTANT: Store a reference to the floating container
            this.floatingContainer = floatingContainer;

            // Get dimensions of floating container
            const containerRect = floatingContainer.node().getBoundingClientRect();

            // Use container width and adjust height for controls/legend
            this.width = containerRect.width;
            this.height = containerRect.height;

            // console.log(`Moving chart to float container: ${this.width}x${this.height}`);

            // Move SVG to floating container
            const svg = this.originalContainer.select('svg');
            if (svg.node()) {
                floatingContainer.node().appendChild(svg.node());

                // Update chart with the new dimensions
                this.openFloatingChart(this.width, this.height);
            } else {
                console.error('SVG element not found in original container');
            }

        } catch (error) {
            console.error('Error in moveChartToFloat:', error);
        }
    }

    moveChartToOriginal() {
        try {
            // console.log('Moving chart back to original container');
            this.visible = false;
            $(window).off('resize.chartModal');

            // Get floating container
            const floatingContainer = d3.select(`#floating-${this.containerId}`);

            // Completely remove SVG from floating container
            if (floatingContainer.select('svg').node()) {
                floatingContainer.select('svg').remove();
                // console.log('Removed SVG from floating container');
            }

            // Show the selectors again if they were hidden
            if (this.originalContainer) {
                this.originalContainer.selectAll(".error_bars_selector-container, .year-selector-container")
                    .style("visibility", "visible");
            }

            // Reset dimensions to original values
            this.width = this.originalWidth;
            this.height = this.originalHeight;
            // console.log(`Reset dimensions to original: ${this.width}x${this.height}`);

            // Call closeFloatingChart to handle cleanup and SVG recreation
            // This will create a new SVG with correct dimensions in the original container
            this.closeFloatingChart();

            // IMPORTANT: Properly hide the bootbox modal
            if (this.currentDialog) {
                // Ensure the modal is properly hidden
                this.currentDialog.modal('hide');

                // Force removal of modal elements from DOM
                setTimeout(() => {
                    if (this.currentDialog) {
                        this.currentDialog.remove();
                        this.currentDialog = null;
                    }

                    // Force removal of backdrop
                    $('.modal-backdrop').remove();

                    // Remove modal-open class from body
                    $('body').removeClass('modal-open').css('padding-right', '');

                    // Remove any orphaned modals
                    $('.bootbox').remove();

                    // Trigger a resize event after modal is closed
                    setTimeout(() => {
                        // console.log('Triggering window resize after modal cleanup');
                        // $(window).trigger('resize');
                    }, 100);
                }, 300);

            } else {
                // Clean up Bootstrap modal artifacts even without a dialog reference
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open').css('padding-right', '');
                $('.bootbox').remove();
            }

        } catch (error) {
            console.error('Error in moveChartToOriginal:', error);

            // Emergency cleanup
            this.visible = false;
            $(window).off('resize.chartModal'); // Also remove event handler in error case
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open').css('padding-right', '');
            if (this.currentDialog) {
                this.currentDialog.modal('hide');
                this.currentDialog = null;
            }
        }
    }

    // Add error handling to handleResize
    handleResize() {
        try {
            // First check if the floating window is still visible
            if (!this.visible) {
                // console.log('Floating window not visible, skipping resize');
                return;
            }

            const floatingContainer = d3.select(`#floating-${this.containerId}`);
            if (!floatingContainer.node()) {
                // console.log('Floating container not found in handleResize - window may have been closed');
                return; // Exit gracefully instead of throwing an error
            }

            // Get the actual size of the floating container
            const containerRect = floatingContainer.node().getBoundingClientRect();
            // console.log(`Floating container size in handleResize: ${containerRect.width}x${containerRect.height}`);

            // Update dimensions
            this.width = containerRect.width;
            this.height = containerRect.height;

            // Update SVG dimensions directly
            const svg = floatingContainer.select('svg');
            if (svg.node()) {
                svg
                    .attr('width', this.width)
                    .attr('height', this.height)
                    .attr('viewBox', `0 0 ${this.width} ${this.height}`);

                // console.log(`SVG dimensions updated to: ${this.width}x${this.height}`);

                // Call resize method
                this.resizeFloatingChart(this.width, this.height);
            } else {
                // console.log('SVG element not found in floating container');
            }

        } catch (error) {
            console.error('Error in handleResize:', error);
        }
    }

    resizeFloatingChart(width, height) {

        try {
            // First check if we should be resizing
            if (!this.visible) {
                // console.log('Floating window not visible, skipping resizeFloatingChart');
                return;
            }

            // console.log(`Resizing floating chart to: ${width}x${height}`);

            // Get the SVG element
            const floatingContainer = d3.select(`#floating-${this.containerId}`);
            if (!floatingContainer.node()) {
                // console.log('Floating container not found in resizeFloatingChart');
                return;
            }

            const svg = floatingContainer.select('svg');
            if (svg.node()) {
                // Update SVG dimensions
                svg
                    .attr('width', width)
                    .attr('height', height)
                    .attr('viewBox', `0 0 ${width} ${height}`);

                // If chart has a specific resize method, call it
                if (typeof this.updateChartDimensions === 'function') {
                    this.updateChartDimensions(width, height);
                }
                // Alternatively, if the chart has a render method, call it with new dimensions
                else if (typeof this.render === 'function') {
                    this.render(width, height);
                }

                // console.log(`Floating chart resize complete: ${width}x${height}`);
            } else {
                // console.log('SVG element not found in floating container');
            }
        } catch (error) {
            console.error('Error in resizeFloatingChart:', error);
        }
    }


    destroy() {
        try {
            // Remove window resize event listener
            $(window).off('resize.chartModal');

            // Remove scale select event listener
            $(`#chart-scale-${this.containerId}`).off('change');

            // Clear dialog reference
            this.currentDialog = null;

            // Remove wrapper and restore original container
            const wrapper = document.querySelector(`.${this.containerId}_chart-flex-wrapper`);
            if (wrapper) {
                const originalContainer = document.getElementById(this.containerId);
                if (originalContainer && wrapper.parentNode) {
                    wrapper.parentNode.insertBefore(originalContainer, wrapper);
                }
                wrapper.remove();
            }

            // Remove floating button container
            const buttonContainer = document.querySelector(`.${this.containerId}_chart-button-container`);
            if (buttonContainer) {
                buttonContainer.remove();
            }

            // Remove floating button styles
            const buttonStyle = document.getElementById(`${this.containerId}_chart-float-button-style`);
            if (buttonStyle) {
                buttonStyle.remove();
            }

            // Remove bootbox modal styles
            const modalStyles = document.getElementById('bootbox-float-styles');
            if (modalStyles) {
                modalStyles.remove();
            }

            // Remove any open bootbox dialogs
            bootbox.hideAll();

            // Remove floating container
            const floatingContainer = document.getElementById(`floating-${this.containerId}`);
            if (floatingContainer) {
                floatingContainer.remove();
            }

            // Remove event listeners
            const container = d3.select(`#${this.containerId}`);
            container.selectAll(`.${this.containerId}_chart-float-button`)
                .on('click', null);

            // Remove modal event listeners
            $('.modal').off('shown.bs.modal');
            $('.modal').off('hidden.bs.modal');

            // Remove draggable functionality
            $('.modal-content').draggable('destroy');

            // Clear all references
            this.originalContainer = null;
            this.originalWidth = null;
            this.originalHeight = null;
            this.width = null;
            this.height = null;
            this.containerId = null;
            this.dialogSize = null;
            this.title = null;

            // Clear methods
            this.getTitle = null;
            this.getDialogOptions = null;
            this.wrapContainer = null;
            this.addFloatingButton = null;
            this.showDialog = null;
            this.moveChartToFloat = null;
            this.moveChartToOriginal = null;
            this.handleResize = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}