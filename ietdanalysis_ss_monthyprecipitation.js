class MonthlyPrecipitationPlot extends ChartCommons {
    constructor(containerId, rawHPCPData, IETDHPCPData) {
        super(containerId);
        this.containerId = containerId;
        this.rawData = rawHPCPData;
        this.IETDData = IETDHPCPData;
        this.margin = {top: 20, right: 20, bottom: 50, left: 60};
        this.monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        this.selectedYear = 'all';

        // Bind methods to this
        this.resize = this.resize.bind(this);
        this.processData = this.processData.bind(this);
        this.createScales = this.createScales.bind(this);
        this.createAxes = this.createAxes.bind(this);
        this.createLine = this.createLine.bind(this);
        this.createTooltip = this.createTooltip.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);

        // Initialize the chart
        this.initialize();
    }

    getAvailableYears() {
        const years = new Set();

        // Get years from both datasets and convert to strings
        this.rawData.forEach(d => {
            const year = new Date(d[0]).getFullYear().toString();
            years.add(year);
        });

        this.IETDData.forEach(d => {
            const year = new Date(d[0]).getFullYear().toString();
            years.add(year);
        });

        return ['all', ...Array.from(years).sort()];
    }

    initialize() {
        // Get container dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Create year selector
        this.createYearSelector();

        this.selectedErrorBar = 'none';

        this.createErrorBarSelector();

        // Process data
        this.processData();

        // Create SVG
        this.createSvg();

        // Create scales and axes
        this.createScales();
        this.createAxes();

        // Create the visualization
        this.createVisualization();

        // Add resize listener
        this.debouncedResize = this.debounce(this.resize, 250);
        window.addEventListener('resize', this.debouncedResize);
    }

    drawErrorBars() {
        if (this.selectedErrorBar === 'none') {
            this.svg.selectAll(".error-bar").remove();
            return;
        }

        // Draw error bars for raw data
        this.drawErrorBarGroup(this.rawProcessedData, "raw", "#377eb8");

        // Draw error bars for IETD data
        this.drawErrorBarGroup(this.ietdProcessedData, "ietd", "#e41a1c");
    }

    drawErrorBarGroup(data, className, color) {
        // Define darker colors for error bars
        const errorBarColors = {
            "#377eb8": "#1a4d80", // Darker blue for raw data
            "#e41a1c": "#8b0000"  // Darker red for IETD data
        };
        const errorBarColor = errorBarColors[color] || color;

        // Remove existing error bars
        this.svg.selectAll(`.error-bar.${className}`).remove();

        // Draw new error bars
        const errorBars = this.svg.selectAll(`.error-bar.${className}`)
            .data(data)
            .enter()
            .append("g")
            .attr("class", `error-bar ${className}`);

        // Vertical line
        errorBars.append("line")
            .attr("x1", d => this.xScale(d.month))
            .attr("x2", d => this.xScale(d.month))
            .attr("y1", d => this.yScale(d.average + d.error))
            .attr("y2", d => this.yScale(d.average - d.error))
            .attr("stroke", errorBarColor)
            .attr("stroke-width", 1);

        // Top cap
        errorBars.append("line")
            .attr("x1", d => this.xScale(d.month) - 4)
            .attr("x2", d => this.xScale(d.month) + 4)
            .attr("y1", d => this.yScale(d.average + d.error))
            .attr("y2", d => this.yScale(d.average + d.error))
            .attr("stroke", errorBarColor)
            .attr("stroke-width", 1);

        // Bottom cap
        errorBars.append("line")
            .attr("x1", d => this.xScale(d.month) - 4)
            .attr("x2", d => this.xScale(d.month) + 4)
            .attr("y1", d => this.yScale(d.average - d.error))
            .attr("y2", d => this.yScale(d.average - d.error))
            .attr("stroke", errorBarColor)
            .attr("stroke-width", 1);
    }

    createErrorBarSelector() {
        const selectorContainer = d3.select(`#${this.containerId}`)
            .append("div")
            .attr("class", "error_bars_selector-container")
            .style("position", "absolute")
            .style("top", `${this.innerHeight + 48}px`)
            .style("left", "12px")
            .style("display", "flex")
            .style("gap", "10px");

        // Error Bar Selector
        const errorBarSelect = selectorContainer
            .append("select")
            .attr("class", "error-bar-selector")
            .style("padding", "1px 1px")
            .style("font-family", "Arial")
            .style("font-size", "10px")
            .on("change", (event) => {
                this.selectedErrorBar = event.target.value;
                this.processData();
                this.updateVisualization();
            });

        errorBarSelect.selectAll("option")
            .data(['none', 'sd', 'se', 'ci'])
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => ({
                'none': 'No Error Bars',
                'sd': 'Standard Deviation',
                'se': 'Standard Error',
                'ci': 'Confidence Interval (95%)'
            })[d]);
    }

    createYearSelector() {
        const selectorContainer = d3.select(`#${this.containerId}`)
            .append("div")
            .attr("class", "year-selector-container")  // Add a class for easy selection
            .style("position", "absolute")
            .style("top", "-5px")
            .style("right", "20px");

        const select = selectorContainer
            .append("select")
            .attr("class", "year-selector")  // Add a class for easy selection
            .style("padding", "2px 2px")
            .style("font-family", "Arial")
            .style("font-size", "10px")
            .on("change", (event) => {
                this.selectedYear = event.target.value;
                this.processData();
                this.updateVisualization();
            });

        this.updateYearSelector(); // Initial population of options
    }

    updateYearSelector() {
        const select = d3.select(`#${this.containerId}`)
            .select(".year-selector");

        // Get current selection
        const currentValue = select.property("value");

        // Get new years
        const years = this.getAvailableYears();

        // Update options
        const options = select.selectAll("option")
            .data(years);

        // Remove old options
        options.exit().remove();

        // Update existing options
        options
            .attr("value", d => d)
            .text(d => d === 'all' ? 'All Years' : d);

        // Add new options
        options.enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d === 'all' ? 'All Years' : d);

        // If current selection is no longer valid, reset to 'all' and update visualization
        if (!years.includes(currentValue)) {
            select.property("value", 'all');
            this.selectedYear = 'all';
            // Trigger data processing and visualization update
            this.processData();
        } else {
            select.property("value", currentValue);
        }
    }

    updateVisualization() {
        // Update scales
        this.createScales();

        // Update the chart
        this.redrawVisualization();

        // Update title to show selected year
        this.svg.select(".title.monthly")
            .text(`Monthly Average Precipitation ${this.selectedYear === 'all' ? '' : `(${this.selectedYear})`}`);
    }

    calculateErrorBars(data, type) {
        return data.map(monthData => {
            // Get all values for this month and year selection
            const values = this.getMonthlyValues(monthData.month);
            const n = values.length;

            // Only calculate if we have data points
            if (n > 0) {
                const mean = d3.mean(values);
                const sd = d3.deviation(values);

                let error;
                switch(type) {
                    case 'sd':
                        error = sd;
                        break;
                    case 'se':
                        // SE = SD/√n
                        error = sd / Math.sqrt(n);
                        // Optional: Scale SE for better visibility
                        // error = (sd / Math.sqrt(n)) * 2; // Scale factor can be adjusted
                        break;
                    case 'ci':
                        // 95% CI = mean ± (1.96 * SE)
                        error = 1.96 * (sd / Math.sqrt(n));
                        break;
                    default:
                        error = 0;
                }

                // // Debug logging
                // console.log(`Month ${monthData.month + 1}:`, {
                //     'n': n,
                //     'mean': mean,
                //     'sd': sd,
                //     'se': sd / Math.sqrt(n),
                //     'ci': 1.96 * (sd / Math.sqrt(n)),
                //     'final_error': error
                // });

                return {
                    ...monthData,
                    error: error || 0,
                    n: n // Add sample size for reference
                };
            }

            return {
                ...monthData,
                error: 0,
                n: 0
            };
        });
    }

    getMonthlyValues(month) {
        // Get all individual values for a specific month (not averages)
        const values = this.rawData
            .filter(d => {
                const date = new Date(d[0]);
                return (this.selectedYear === 'all' || date.getFullYear().toString() === this.selectedYear)
                    && date.getMonth() === month;
            })
            .map(d => parseFloat(d[2]))
            .filter(v => !isNaN(v) && v !== null && v !== undefined && v >= 0);

        return values;
    }

    processData() {
        try {
            // Initialize monthly data arrays
            const rawMonthlyData = Array(12).fill().map(() => ({
                count: 0,
                sum: 0
            }));
            const ietdMonthlyData = Array(12).fill().map(() => ({
                count: 0,
                sum: 0
            }));

            // Filter function for year selection
            const yearFilter = (date) => {
                if (this.selectedYear === 'all') return true;
                return new Date(date).getFullYear() === parseInt(this.selectedYear);
            };

            // Process raw data
            this.rawData.forEach((d, index) => {
                try {
                    if (!yearFilter(d[0])) return;

                    const date = new Date(d[0]);
                    const month = date.getMonth();
                    const precipitation = parseFloat(d[2]);

                    if (!isNaN(precipitation) && isFinite(precipitation) && precipitation >= 0) {
                        rawMonthlyData[month].count++;
                        rawMonthlyData[month].sum += precipitation;
                    }
                } catch (error) {
                    console.error(`Error processing raw data at index ${index}:`, error);
                }
            });

            // Process IETD data
            this.IETDData.forEach((d, index) => {
                try {
                    if (!yearFilter(d[0])) return;

                    const date = new Date(d[0]);
                    const month = date.getMonth();
                    const precipitation = parseFloat(d[2]);

                    if (!isNaN(precipitation) && isFinite(precipitation) && precipitation >= 0) {
                        ietdMonthlyData[month].count++;
                        ietdMonthlyData[month].sum += precipitation;
                    }
                } catch (error) {
                    console.error(`Error processing IETD data at index ${index}:`, error);
                }
            });

            // Calculate averages and include error calculations
            this.rawProcessedData = rawMonthlyData.map((data, month) => ({
                month: month,
                average: data.count > 0 ? data.sum / data.count : 0,
                count: data.count
            }));

            this.ietdProcessedData = ietdMonthlyData.map((data, month) => ({
                month: month,
                average: data.count > 0 ? data.sum / data.count : 0,
                count: data.count
            }));

            // Calculate error bars for both datasets
            this.rawProcessedData = this.calculateErrorBars(this.rawProcessedData, this.selectedErrorBar);
            this.ietdProcessedData = this.calculateErrorBars(this.ietdProcessedData, this.selectedErrorBar);

        } catch (error) {
            console.error('Error in processData:', error);
            // Initialize empty processed data as fallback
            this.rawProcessedData = Array(12).fill().map((_, month) => ({
                month: month,
                average: 0,
                count: 0,
                error: 0,
                n: 0
            }));
            this.ietdProcessedData = Array(12).fill().map((_, month) => ({
                month: month,
                average: 0,
                count: 0,
                error: 0,
                n: 0
            }));
        }
    }


    // Add this new method to update data and refresh the chart
    async updateData(newRawData, newIETDData){
        // Update the data
        this.IETDData = newIETDData;
        this.rawData = newRawData;

        // Reprocess the data
        this.processData();

        // Update year selector with new years
        this.updateYearSelector();

        // Redraw visualization
        this.redrawVisualization();
    }

    redrawVisualization() {

        // Update scales with new data
        this.createScales();

        // Update y-axis
        const yAxis = d3.axisLeft(this.yScale)
            .ticks(5)
            .tickFormat(d => {
                if (isNaN(d) || d === null) return "";
                return d.toFixed(2);
            });

        // Get current values from axis ticks
        const currentValues = this.yAxis.selectAll('.tick')
            .data()
            .filter(d => !isNaN(d));

        // Get new values that will be shown
        const newValues = yAxis.scale().ticks(5);

        // Calculate the maximum relative change
        const maxRelativeChange = Math.max(
            ...currentValues.map(curr => {
                const correspondingNew = newValues.find(n => !isNaN(n));
                if (!curr || !correspondingNew) return 0;
                return Math.abs(curr - correspondingNew) / Math.max(Math.abs(curr), 1e-10);
            })
        );

        // Only use transition if the change is significant
        if (maxRelativeChange > 1e-10) {
            this.yAxis
                .transition()
                .duration(750)
                .call(yAxis);
        } else {
            this.yAxis.call(yAxis);
        }

        // Get line generator
        const line = this.createLine();

        // Update lines with error handling
        const validRawData = this.rawProcessedData.filter(d =>
            !isNaN(d.month) && !isNaN(d.average) && d.average !== null);
        const validIETDData = this.ietdProcessedData.filter(d =>
            !isNaN(d.month) && !isNaN(d.average) && d.average !== null);

        // Update lines with transition
        if (maxRelativeChange > 1e-10) {
            this.svg.select(".raw-line")
                .datum(validRawData)
                .transition()
                .duration(750)
                .attr("d", line);

            this.svg.select(".ietd-line")
                .datum(validIETDData)
                .transition()
                .duration(750)
                .attr("d", line);
        } else {
            this.svg.select(".raw-line")
                .datum(validRawData)
                .attr("d", line);

            this.svg.select(".ietd-line")
                .datum(validIETDData)
                .attr("d", line);
        }

        // Update points
        // Raw points
        const rawPoints = this.svg.selectAll(".raw-point")
            .data(validRawData);

        rawPoints.exit().remove();

        if (maxRelativeChange > 1e-10) {
            rawPoints
                .transition()
                .duration(750)
                .attr("cx", d => this.xScale(d.month))
                .attr("cy", d => this.yScale(d.average));
        } else {
            rawPoints
                .attr("cx", d => this.xScale(d.month))
                .attr("cy", d => this.yScale(d.average));
        }

        rawPoints.enter()
            .append("circle")
            .attr("class", "point raw-point")
            .attr("r", 5)
            .attr("fill", "#377eb8")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("cx", d => this.xScale(d.month))
            .attr("cy", d => this.yScale(d.average))
            .on("mouseover", (event, d) => this.handleMouseOver(event, d, "Raw"))
            .on("mousemove", this.handleMouseMove)
            .on("mouseout", (event, d) => this.handleMouseOut(event, d, "Raw"));

        // IETD points
        const ietdPoints = this.svg.selectAll(".ietd-point")
            .data(validIETDData);

        ietdPoints.exit().remove();

        if (maxRelativeChange > 1e-10) {
            ietdPoints
                .transition()
                .duration(750)
                .attr("cx", d => this.xScale(d.month))
                .attr("cy", d => this.yScale(d.average));
        } else {
            ietdPoints
                .attr("cx", d => this.xScale(d.month))
                .attr("cy", d => this.yScale(d.average));
        }

        ietdPoints.enter()
            .append("circle")
            .attr("class", "point ietd-point")
            .attr("r", 5)
            .attr("fill", "#e41a1c")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("cx", d => this.xScale(d.month))
            .attr("cy", d => this.yScale(d.average))
            .on("mouseover", (event, d) => this.handleMouseOver(event, d, "IETD"))
            .on("mousemove", this.handleMouseMove)
            .on("mouseout", (event, d) => this.handleMouseOut(event, d, "IETD"));

        // Draw new error bars
        this.drawErrorBars();
    }

    createSvg() {
        // Clear existing SVG
        d3.select(`#${this.containerId}`).select("svg").remove();

        // Create new SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    createScales() {
        this.xScale = d3.scaleLinear()
            .domain([0, 11])
            .range([0, this.innerWidth]);

        // Find max value from both datasets, including error bars if present
        const maxRaw = d3.max(this.rawProcessedData, d =>
            this.selectedErrorBar !== 'none' ? d.average + d.error : d.average
        );
        const maxIETD = d3.max(this.ietdProcessedData, d =>
            this.selectedErrorBar !== 'none' ? d.average + d.error : d.average
        );
        const maxValue = Math.max(maxRaw, maxIETD);

        this.yScale = d3.scaleLinear()
            .domain([0, maxValue * 1.1])
            .range([this.innerHeight, 0]);
    }

    createAxes() {
        this.xAxis = this.svg.append("g")
            .attr("color", "black")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale)
                .ticks(12)
                .tickFormat(d => this.monthNames[d]));

        this.yAxis = this.svg.append("g")
            .attr("color", "black")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2)));
    }

    createLine() {
        return d3.line()
            .x(d => this.xScale(d.month))
            .y(d => this.yScale(d.average))
            .curve(d3.curveMonotoneX);
    }

    createTooltip() {
        return d3.select("body")
            .append("div")
            .attr("class", "precipitation-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("padding", "10px")
            .style("border", "1px solid #000")
            .style("border-radius", "5px")
            .style("font-size", "10px")
            .style("font-family", "Arial")
            .style("min-width", "150px")
            .style("line-height", "1.4")
            .style("pointer-events", "none"); // Prevents tooltip from interfering with mouse events
    }

    createVisualization() {
        const line = this.createLine();

        // Add raw data line
        this.svg.append("path")
            .datum(this.rawProcessedData)
            .attr("class", "line raw-line")
            .attr("fill", "none")
            .attr("stroke", "#377eb8")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add IETD data line
        this.svg.append("path")
            .datum(this.ietdProcessedData)
            .attr("class", "line ietd-line")
            .attr("fill", "none")
            .attr("stroke", "#e41a1c")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Create tooltip
        this.tooltip = this.createTooltip();

        // Add points for raw data
        this.svg.selectAll(".raw-point")
            .data(this.rawProcessedData)
            .enter()
            .append("circle")
            .attr("class", "point raw-point")
            .attr("cx", d => this.xScale(d.month))
            .attr("cy", d => this.yScale(d.average))
            .attr("r", 5)
            .attr("fill", "#377eb8")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d, "Raw"))
            .on("mousemove", this.handleMouseMove)
            .on("mouseout", (event, d) => this.handleMouseOut(event, d, "Raw"));

        // Add points for IETD data
        this.svg.selectAll(".ietd-point")
            .data(this.ietdProcessedData)
            .enter()
            .append("circle")
            .attr("class", "point ietd-point")
            .attr("cx", d => this.xScale(d.month))
            .attr("cy", d => this.yScale(d.average))
            .attr("r", 5)
            .attr("fill", "#e41a1c")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d, "IETD"))
            .on("mousemove", this.handleMouseMove)
            .on("mouseout", (event, d) => this.handleMouseOut(event, d, "IETD"));

        // Add legend
        this.addLegend();

        // Add labels
        this.addLabels();
    }

    addLegend() {
        const legendHeight = 30;
        const legendSpacing = 85; // Space between legend items

        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.innerWidth - 1.8 * legendSpacing}, ${this.innerHeight + 40})`);

        // Raw data legend item
        const rawLegend = legend.append("g")
            .attr("transform", `translate(0, 0)`);

        rawLegend.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "#377eb8")
            .attr("stroke-width", 2);

        rawLegend.append("text")
            .attr("x", 25)
            .attr("y", 4)
            .text("Original Data")
            .attr("font-size", "10px")
            .attr("font-family", "Arial");

        // IETD data legend item
        const ietdLegend = legend.append("g")
            .attr("transform", `translate(${legendSpacing}, 0)`);

        ietdLegend.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "#e41a1c")
            .attr("stroke-width", 2);

        ietdLegend.append("text")
            .attr("x", 25)
            .attr("y", 4)
            .text("IETD Data")
            .attr("font-size", "10px")
            .attr("font-family", "Arial");
    }


    addLabels() {
        // X-axis label
        // this.svg.append("text")
        //     .attr("class", "x-label")
        //     .attr("text-anchor", "middle")
        //     .attr("x", this.innerWidth / 2)
        //     .attr("y", this.innerHeight + 40)
        //     .attr("font-size", "12px")
        //     .attr("font-family", "Arial")
        //     .text("Month");

        // Y-axis label
        this.svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.innerHeight / 2)
            .attr("y", -50)
            .attr("font-size", "12px")
            .attr("font-family", "Arial")
            .text("HPCP (in/hr)");

        // Title
        this.svg.append("text")
            .attr("class", "title monthly")
            .attr("x", this.innerWidth / 2)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text("Monthly Average Precipitation");
    }

    handleMouseOver(event, d, dataType) {
        const month = d.month;
        const rawValue = this.rawProcessedData[month].average;
        const ietdValue = this.ietdProcessedData[month].average;
        const difference = (ietdValue - rawValue).toFixed(2);
        const diffColor = difference > 0 ? "green" : difference < 0 ? "red" : "gray";

        // Get error information if available
        const errorValue = d.error ? d.error.toFixed(4) : "N/A";
        const sampleSize = d.n || "N/A";

        d3.select(event.currentTarget)
            .attr("r", 7)
            .attr("fill", dataType === "Raw" ? "#34785c" : "#cc6540");

        this.tooltip.html(`
        <div style="font-weight: bold; color: black; margin-bottom: 5px">
            ${this.monthNames[d.month]}
        </div>
        <div style="color: #e41a1c; margin-bottom: 3px">
            IETD Data: ${ietdValue.toFixed(2)} in/hr
        </div>
        <div style="color: #377eb8; margin-bottom: 3px">
            Original Data: ${rawValue.toFixed(2)} in/hr
        </div>
        <div style="color: ${diffColor}; font-size: 11px; margin-top: 3px">
            Difference: ${difference} in/hr
        </div>
        ${this.selectedErrorBar !== 'none' ? `
        <div style="margin-top: 5px; font-size: 11px">
            ${this.selectedErrorBar.toUpperCase()}: ±${errorValue}
            <br>Sample size: ${sampleSize}
        </div>
        ` : ''}
    `)
            .style("visibility", "visible")
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
    }


    handleMouseMove(event) {
        const tooltipWidth = this.tooltip.node().offsetWidth;
        const mouseX = event.pageX;
        const windowWidth = window.innerWidth;

        // Check if tooltip would overflow on the right
        // const wouldOverflow = (mouseX + tooltipWidth + 10) > windowWidth;

        // Position tooltip to the left of the point if it would overflow
        // const xPosition = wouldOverflow ?
        //     (mouseX - tooltipWidth - 10) :
        //     (mouseX + 10);
        //
        // this.tooltip
        //     .style("top", (event.pageY - 10) + "px")
        //     .style("left", xPosition + "px");
    }

    handleMouseOut(event, d, dataType) {
        d3.select(event.currentTarget)
            .attr("r", 5)
            .attr("fill", dataType === "Raw" ? "#377eb8" : "#e41a1c");  // Original colors based on data type
        this.tooltip.style("visibility", "hidden");
    }

    resize() {
        // Check if the container is visible
        if (!this.isVisible()) return;

        // Update dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Update SVG
        d3.select(`#${this.containerId} svg`)
            .attr("width", this.width)
            .attr("height", this.height);

        // Update scales
        this.createScales();

        // Update axes
        this.xAxis
            .attr("transform", `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale)
                .ticks(12)
                .tickFormat(d => this.monthNames[d]));

        this.yAxis.call(d3.axisLeft(this.yScale)
            .ticks(5)
            .tickFormat(d => d.toFixed(2)));

        // Update lines
        const line = this.createLine();
        this.svg.select(".raw-line")
            .attr("d", line);
        this.svg.select(".ietd-line")
            .attr("d", line);

        // Update points
        this.svg.selectAll(".raw-point")
            .attr("cx", d => this.xScale(d.month))
            .attr("cy", d => this.yScale(d.average));

        this.svg.selectAll(".ietd-point")
            .attr("cx", d => this.xScale(d.month))
            .attr("cy", d => this.yScale(d.average));

        // Update error bars
        if (this.selectedErrorBar !== 'none') {
            // Redraw error bars instead of updating
            this.drawErrorBars();
        }

        // Update legend position
        this.svg.select(".legend")
            .attr("transform", `translate(${this.innerWidth / 2 - 100}, ${this.innerHeight + 40})`);

        // Update labels
        this.svg.select(".x-label")
            .attr("x", this.innerWidth / 2)
            .attr("y", this.innerHeight + 40);

        this.svg.select(".y-label")
            .attr("x", -this.innerHeight / 2);

        this.svg.select(".title.monthly")
            .attr("x", this.innerWidth / 2);

        // Update error bar selector container position if it exists
        const errorBarContainer = container.select(".error-bar-container");
        if (!errorBarContainer.empty()) {
            errorBarContainer
                .style("bottom", "10px")
                .style("left", "50%");
        }
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    destroy() {
        try {
            // Remove window event listener with debounced function
            window.removeEventListener('resize', this.debouncedResize);

            // Get container
            const container = d3.select(`#${this.containerId}`);

            // Remove SVG and all its child elements
            container.select("svg").remove();

            // Remove tooltip
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }

            // Remove year selector container
            container.select(".year-selector-container").remove();
            container.select(".error_bars_selector-container").remove();

            // Remove specific elements (in case they weren't removed with svg)
            container.selectAll(".raw-line").remove();
            container.selectAll(".ietd-line").remove();
            container.selectAll(".raw-point").remove();
            container.selectAll(".ietd-point").remove();
            container.selectAll(".x-axis").remove();
            container.selectAll(".y-axis").remove();
            container.selectAll(".x-label").remove();
            container.selectAll(".y-label").remove();
            container.selectAll(".title").remove();
            container.selectAll(".monthly").remove();
            container.selectAll(".legend").remove();
            container.selectAll(".precipitation-tooltip").remove();

            // Remove all event listeners
            container.selectAll(".raw-point, .ietd-point")
                .on("mouseover", null)
                .on("mousemove", null)
                .on("mouseout", null);

            // Clear all data references
            this.rawData = null;
            this.IETDData = null;
            this.rawProcessedData = null;
            this.ietdProcessedData = null;
            this.svg = null;
            this.tooltip = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.selectedYear = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.monthNames = null;
            this.debouncedResize = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}