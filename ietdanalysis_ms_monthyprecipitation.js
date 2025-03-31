class MonthlyPrecipitationPlot extends ChartCommons {
    constructor(containerId, IETDHPCPData, IETDHPCPStations) {
        super(containerId);
        this.containerId = containerId;
        this.IETDData = IETDHPCPData;
        this.IETDHPCPStations = IETDHPCPStations;
        this.margin = {top: 20, right: 40, bottom: 50, left: 60};

        // Get container dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        this.selectedErrorBar = 'none';
        this.selectedYear = 'all';

        // Create station color scale
        const stations = Object.keys(this.IETDData);
        this.stationColorScale = d3.scaleOrdinal(d3.schemeDark2)
            .domain(stations);

        // Add offset configuration
        this.offsetConfig = {
            step: 0, // No offset
            getOffset: () => 0,
        };

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

    formatStationInfoTooltip(stationObj) {
        let parts = [];
        parts.push(`ID: ${stationObj.id}`);
        if (stationObj.FAA_ID !== null) {
            parts.push(`FAA: ${stationObj.FAA_ID}`);
        }
        if (stationObj.NCDC_ID !== null) {
            parts.push(`NCDC: ${stationObj.NCDC_ID}`);
        }
        if (stationObj.GHCND_ID !== null) {
            parts.push(`GHCND: ${stationObj.GHCND_ID}`);
        }
        if (stationObj.COOP_ID !== null) {
            parts.push(`COOP: ${stationObj.COOP_ID}`);
        }
        return parts.join('<br>'); // Use line breaks for better readability in tooltip
    }


    sanitizeStationId(station) {
        return station.replace(/[^a-zA-Z0-9]/g, '_');
    }

    getAvailableYears() {
        const years = [...new Set(
            Object.values(this.IETDData)
                .flat()  // flatten the array of station data
                .map(d => new Date(d.dateFrom).getFullYear())
                .filter(year => !isNaN(year))
        )].sort((a, b) => a - b);  // numerical sort

        return ['all', ...years];
    }

    getMonthlyValues(month) {
        // Get all individual values for a specific month (not averages)
        const values = Object.values(this.IETDData)  // Get all station data arrays
            .flat()  // Flatten the array of station data
            .filter(d => {
                const date = new Date(d.dateFrom);  // Assuming dateFrom is your date field
                return (this.selectedYear === 'all' || date.getFullYear().toString() === this.selectedYear)
                    && date.getMonth() === month;
            })
            .map(d => parseFloat(d.volume))
            .filter(v => !isNaN(v) && v !== null && v !== undefined && v >= 0);

        return values;
    }

    initialize() {
        // Create year selector
        this.createYearSelector();

        // Create error bar selector
        this.createErrorBarSelector();

        // Create offset toggle checkbox
        this.createOffsetToggle();

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

    createOffsetToggle() {
        // Add a checkbox at the top left corner of the container
        // Add a checkbox with a label inside a container with an outline
        const toggleContainer = d3.select(`#${this.containerId}`)
            .append("div")
            .attr("class", "offset-toggle-container")
            .style("position", "absolute")
            .style("top", "-4px")
            .style("left", "12px")
            .style("display", "flex")
            .style("align-items", "center") // Vertical alignment
            .style("justify-content", "flex-start") // Horizontal alignment
            .style("gap", "4px") // Reduced gap between checkbox and label
            .style("padding", "2px 2px") // Slightly more horizontal padding
            .style("border", "1px solid #ccc")
            .style("border-radius", "2px")
            .style("background-color", "white")
            .style("z-index", "5");

        // Add checkbox input
        const checkbox = toggleContainer
            .append("input")
            .attr("type", "checkbox")
            .attr("id", "offsetToggle")
            .style("margin", "0") // Remove default margins
            .style("width", "12px")
            .style("height", "12px")
            .style("flex-shrink", "0") // Prevent checkbox from shrinking
            .style("vertical-align", "middle") // Align with text
            .on("change", (event) => {
                // Enable or disable offsetConfig based on checkbox state
                const isChecked = event.target.checked;
                this.offsetConfig = isChecked
                    ? {
                        step: 6, // pixels between each station
                        getOffset: (stationIndex, totalStations, month) => {
                            const totalOffset = (totalStations - 1) * this.offsetConfig.step;
                            const startOffset = -totalOffset / 2;
                            let offset = startOffset + stationIndex * this.offsetConfig.step;

                            // Adjust offset for January (month 0) and December (month 11)
                            if (month === 0) {
                                offset += 10; // Move January points right
                            } else if (month === 11) {
                                offset -= 10; // Move December points left
                            }

                            return offset;
                        },
                    }
                    : {
                        step: 0, // No offset
                        getOffset: () => 0,
                    };

                // Redraw visualization with the updated offsetConfig
                this.redrawVisualization();
            });

        // Add label for the checkbox
        toggleContainer
            .append("label")
            .attr("for", "offsetToggle")
            .style("font-family", "Arial")
            .style("font-size", "10px")
            .style("margin", "0") // Remove default margins
            .style("cursor", "pointer")
            .style("display", "inline-block") // Better text alignment
            .style("line-height", "14px") // Match the checkbox height
            .style("vertical-align", "middle") // Align with checkbox
            .text("Offset");
    }

    drawErrorBars() {
        if (this.selectedErrorBar === 'none') {
            this.svg.selectAll(".error-bar").remove();
            return;
        }

        // Remove all existing error bars
        this.svg.selectAll(".error-bar").remove();

        // Calculate offset based on number of stations
        const totalStations = this.ietdProcessedData.length;
        const offsetStep = 6; // pixels between each station's error bars
        const totalOffset = (totalStations - 1) * offsetStep;
        const startOffset = -totalOffset / 2; // Center the spread

        // Draw error bars for each station with offset
        this.ietdProcessedData.forEach((stationData, stationIndex) => {
            const sanitizedStation = this.sanitizeStationId(stationData.station);
            const horizontalOffset = startOffset + (stationIndex * offsetStep);

            // Create darker version of the station color for error bars
            const darkenColor = (color) => {
                const rgb = d3.color(color);
                return d3.rgb(
                    Math.floor(rgb.r * 0.7),
                    Math.floor(rgb.g * 0.7),
                    Math.floor(rgb.b * 0.7)
                ).toString();
            };
            const errorBarColor = darkenColor(this.stationColorScale(stationData.station));

            // Filter out invalid data points
            const validData = stationData.monthlyData.filter(d =>
                !isNaN(d.average) &&
                !isNaN(d.error) &&
                d.error !== null &&
                d.average !== null
            );

            // Create error bar groups
            const errorBars = this.svg.selectAll(`.error-bar.station-${sanitizedStation}`)
                .data(validData)
                .enter()
                .append("g")
                .attr("class", `error-bar station-${sanitizedStation}`)
                .style("opacity", 0.7);

            // Create vertical lines with offset
            errorBars.append("line")
                .attr("class", "error-bar-line")
                .attr("x1", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset;
                })
                .attr("x2", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset;
                })
                .attr("y1", d => this.yScale(d.average + d.error))
                .attr("y2", d => this.yScale(d.average - d.error))
                .attr("stroke", errorBarColor)
                .attr("stroke-width", 1.5)
                .attr("pointer-events", "none");

            // Create top caps with offset
            errorBars.append("line")
                .attr("class", "error-bar-cap")
                .attr("x1", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset - 4;
                })
                .attr("x2", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset + 4;
                })
                .attr("y1", d => this.yScale(d.average + d.error))
                .attr("y2", d => this.yScale(d.average + d.error))
                .attr("stroke", errorBarColor)
                .attr("stroke-width", 1.5)
                .attr("pointer-events", "none");

            // Create bottom caps with offset
            errorBars.append("line")
                .attr("class", "error-bar-cap")
                .attr("x1", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset - 4;  // Extend 4 pixels to the left
                })
                .attr("x2", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset + 4;  // Extend 4 pixels to the right
                })
                .attr("y1", d => this.yScale(d.average - d.error))  // Bottom position
                .attr("y2", d => this.yScale(d.average - d.error))  // Same y for horizontal line
                .attr("stroke", errorBarColor)
                .attr("stroke-width", 1.5)
                .attr("pointer-events", "none");


            // Add transition for smooth updates
            errorBars.selectAll("line")
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 0.7);
        });
    }

    createErrorBarSelector() {
        const selectorContainer = d3.select(`#${this.containerId}`)
            .append("div")
            .attr("class", "error_bars_selector-container")
            .style("position", "absolute")  // Change to absolute positioning
            .style("bottom", "12px")        // Position from bottom instead of top
            .style("left", "12px")
            .style("display", "flex")
            .style("gap", "10px")
            .style("z-index", "1");         // Add z-index to ensure proper layering

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
        // Make sure the container has relative positioning
        d3.select(`#${this.containerId}`)
            .style("position", "relative");

        const selectorContainer = d3.select(`#${this.containerId}`)
            .append("div")
            .attr("class", "year-selector-container")
            .style("position", "absolute")
            .style("top", "4px")  // Increased from -5px to ensure visibility
            .style("right", "30px")
            .style("z-index", "5"); // Add z-index to ensure it's above other elements

        const select = selectorContainer
            .append("select")
            .attr("class", "year-selector")
            .style("padding", "2px 2px")  // Increased padding for better visibility
            .style("font-family", "Arial")
            .style("font-size", "10px")    // Increased font size
            .style("border", "1px solid #ccc")  // Add border
            .style("border-radius", "4px")      // Add border radius
            .style("background-color", "white")  // Ensure background is visible
            .on("change", (event) => {
                this.selectedYear = event.target.value;
                this.processData();
                this.updateVisualization();
            });

        this.updateYearSelector();
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

    processData() {
        // Initialize monthly data arrays for each station
        const ietdMonthlyData = {};

        // Filter function for year selection
        const yearFilter = (date) => {
            if (this.selectedYear === 'all') return true;
            return new Date(date).getFullYear() === parseInt(this.selectedYear);
        };

        // Process IETD data by station
        Object.entries(this.IETDData).forEach(([station, data]) => {
            // Initialize monthly data for this station
            ietdMonthlyData[station] = Array(12).fill().map(() => ({
                count: 0,
                sum: 0,
                values: [] // Store individual values for error calculations
            }));

            // Process each data point for this station
            data.forEach((d, index) => {
                try {
                    if (!yearFilter(d.dateFrom)) return;

                    const date = new Date(d.dateFrom);
                    const month = date.getMonth();
                    const precipitation = parseFloat(d.volume);

                    if (!isNaN(precipitation) && isFinite(precipitation) && precipitation >= 0) {
                        ietdMonthlyData[station][month].count++;
                        ietdMonthlyData[station][month].sum += precipitation;
                        ietdMonthlyData[station][month].values.push(precipitation);
                    }
                } catch (error) {
                    console.error(`Error processing IETD data for station ${station} at index ${index}:`, error);
                }
            });
        });

        // Calculate averages and include error calculations per station
        this.ietdProcessedData = Object.entries(ietdMonthlyData).map(([station, monthlyData]) => ({
            station,
            monthlyData: monthlyData.map((data, month) => ({
                month: month,
                average: data.count > 0 ? data.sum / data.count : 0,
                count: data.count,
                values: data.values // Keep values for error calculations
            }))
        }));

        // Calculate error bars for each station
        this.ietdProcessedData = this.ietdProcessedData.map(stationData => ({
            ...stationData,
            monthlyData: this.calculateErrorBars(stationData.monthlyData, this.selectedErrorBar)
        }));

        // Debug log
        // console.log('Processed Data:', this.ietdProcessedData);
    }

    async updateData(newIETDData) {
        // Update the data
        this.IETDData = newIETDData;

        // Reprocess the data
        this.processData();

        // Update year selector with new years
        this.updateYearSelector();

        this.redrawVisualization();
    }

    // Add this new method to update data and refresh the chart
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

        // Update y-axis with transition if change is significant
        if (maxRelativeChange > 1e-10) {
            this.yAxis
                .transition()
                .duration(750)
                .call(yAxis);
        } else {
            this.yAxis.call(yAxis);
        }

        // Update station groups
        const stationGroups = this.svg.selectAll(".station-group")
            .data(this.ietdProcessedData, d => d.station);

        // Remove old groups
        stationGroups.exit().remove();

        // Update existing groups
        stationGroups.each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            const sanitizedStation = this.sanitizeStationId(d.station);
            const totalStations = this.ietdProcessedData.length;
            const horizontalOffset = this.offsetConfig.getOffset(i, totalStations);

            // Create line generator specific to this station
            const line = this.createLine(i, totalStations);

            // Update line
            const path = group.select(`.station-${sanitizedStation}`);
            if (maxRelativeChange > 1e-10) {
                path.transition()
                    .duration(750)
                    .attr("d", d => line(d.monthlyData));
            } else {
                path.attr("d", d => line(d.monthlyData));
            }

            // Update points
            const points = group.selectAll(".ietd-point")
                .data(d.monthlyData);

            // Remove old points
            points.exit().remove();

            // Update existing points
            if (maxRelativeChange > 1e-10) {
                points.transition()
                    .duration(750)
                    .attr("cx", d => {
                        const baseX = this.xScale(d.month);
                        const offset = this.offsetConfig.getOffset(i, totalStations, d.month);
                        return baseX + offset;
                    })
                    .attr("cy", d => this.yScale(d.average));
            } else {
                points
                    .attr("cx", d => {
                        const baseX = this.xScale(d.month);
                        const offset = this.offsetConfig.getOffset(i, totalStations, d.month);
                        return baseX + offset;
                    })
                    .attr("cy", d => this.yScale(d.average));
            }

            // Add new points
            points.enter()
                .append("circle")
                .attr("class", `point ietd-point station-${sanitizedStation}`)
                .attr("r", 3)
                .attr("fill", d => this.stationColorScale(d.station))
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("cx", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(i, totalStations, d.month);
                    return baseX + offset;
                })
                .attr("cy", d => this.yScale(d.average))
                .on("mouseover", (event, d) => this.handleMouseOver(event, {...d, station: sanitizedStation}, "point"))
                .on("mousemove", this.handleMouseMove.bind(this))
                .on("mouseout", (event, d) => this.handleMouseOut(event, {...d, station: sanitizedStation}, "point"));
        });

        // Add new station groups
        const newGroups = stationGroups.enter()
            .append("g")
            .attr("class", d => `station-group station-${this.sanitizeStationId(d.station)}`);

        // Add lines and points to new groups
        newGroups.each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            const sanitizedStation = this.sanitizeStationId(d.station);
            const totalStations = this.ietdProcessedData.length;
            const horizontalOffset = this.offsetConfig.getOffset(i, totalStations);

            // Create line generator specific to this station
            const line = this.createLine(i, totalStations);

            // Add line
            group.append("path")
                .attr("class", `line ietd-line station-${sanitizedStation}`)
                .attr("fill", "none")
                .attr("stroke", d => this.stationColorScale(d.station))
                .attr("stroke-width", 2)
                .attr("d", d => line(d.monthlyData));

            // Add points
            group.selectAll(".ietd-point")
                .data(d.monthlyData)
                .enter()
                .append("circle")
                .attr("class", `point ietd-point station-${sanitizedStation}`)
                .attr("r", 3)
                .attr("fill", d => this.stationColorScale(d.station))
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("cx", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(i, totalStations, d.month);
                    return baseX + offset;
                })
                .attr("cy", d => this.yScale(d.average))
                .on("mouseover", (event, d) => this.handleMouseOver(event, {...d, station: sanitizedStation}, "point"))
                .on("mousemove", this.handleMouseMove.bind(this))
                .on("mouseout", (event, d) => this.handleMouseOut(event, {...d, station: sanitizedStation}, "point"));
        });

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

        // Find max value across all stations, including error bars if present
        const maxIETD = d3.max(this.ietdProcessedData, station =>
            d3.max(station.monthlyData, d =>
                this.selectedErrorBar !== 'none' ? d.average + d.error : d.average
            )
        );

        this.yScale = d3.scaleLinear()
            .domain([0, maxIETD * 1.1]) // Add 10% padding to the top
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

    createLine(stationIndex, totalStations) {
        return d3.line()
            .x(d => {
                const baseX = this.xScale(d.month);
                const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                return baseX + offset;
            })
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

        // Create a group for each station's data
        const stationGroups = this.svg.selectAll(".station-group")
            .data(this.ietdProcessedData)
            .enter()
            .append("g")
            .attr("class", d => `station-group station-${this.sanitizeStationId(d.station)}`);

        // Add data line for each station
        stationGroups.append("path")
            .attr("class", d => `line ietd-line station-${this.sanitizeStationId(d.station)}`)
            .attr("fill", "none")
            .attr("stroke", d => this.stationColorScale(d.station))
            .attr("stroke-width", 2)
            .attr("d", (d, i) => this.createLine(i, this.ietdProcessedData.length)(d.monthlyData));

        // Create tooltip
        this.tooltip = this.createTooltip();

        // Add points for IETD data for each station
        stationGroups.each((stationData, stationIndex, nodes) => {
            const totalStations = this.ietdProcessedData.length;
            const horizontalOffset = this.offsetConfig.getOffset(stationIndex, totalStations);

            d3.select(nodes[stationIndex])
                .selectAll(".ietd-point")
                .data(stationData.monthlyData)
                .enter()
                .append("circle")
                .attr("class", d => `point ietd-point station-${this.sanitizeStationId(stationData.station)}`)
                .attr("cx", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(stationIndex, totalStations, d.month);
                    return baseX + offset;
                })
                .attr("cy", d => this.yScale(d.average))
                .attr("r", 3)
                .attr("fill", () => this.stationColorScale(stationData.station))
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .on("mouseover", (event, d) => this.handleMouseOver(event, { ...d, station: stationData.station }, "IETD"))
                .on("mousemove", this.handleMouseMove)
                .on("mouseout", (event, d) => this.handleMouseOut(event, { ...d, station: stationData.station }, "IETD"));
        });

        // Add legend
        this.addLegend();

        // Add labels
        this.addLabels();
    }

    mouseoverStationLegend(event, stationObj)
    {
        const tooltip = document.getElementById('d3-style-tooltip');

        const station_title = `[${stationObj.id}] ${stationObj.name}`;
        const tooltiptext = this.formatStationInfoTooltip(stationObj);

        tooltip.innerHTML = `
                        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 5px; padding-bottom: 5px">
                            <strong>${station_title}</strong>
                        </div>
                        ${tooltiptext}
                    `;

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        let left = event.pageX + 10;
        let top = event.pageY - tooltipHeight - 10;

        if (left + tooltipWidth > window.innerWidth) {
            left = event.pageX - tooltipWidth - 10;
        }
        if (top < 0) {
            top = event.pageY + 10;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.opacity = '1';
    }

    mouseoutStationLegend() {
        const tooltip = document.getElementById('d3-style-tooltip');
        tooltip.style.opacity = '0';
    }

    mousemoveStationLegend(event) {
        const tooltip = document.getElementById('d3-style-tooltip');

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        let left = event.pageX + 10;
        let top = event.pageY - tooltipHeight - 10;

        if (left + tooltipWidth > window.innerWidth) {
            left = event.pageX - tooltipWidth - 10;
        }
        if (top < 0) {
            top = event.pageY + 10;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    addLegend() {
        // Remove any existing legend
        this.svg.selectAll(".legend").remove();

        // Create legend group at the bottom
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${this.innerHeight + 20})`);

        const padding = 20;
        const itemHeight = 20;

        // Calculate total width first to determine the center offset
        let totalWidth = 0;
        this.ietdProcessedData.forEach((stationData) => {
            const station_sname = this.IETDHPCPStations[stationData.station].sname;

            const tempText = legend.append("text")
                .attr("font-size", "10px")
                .text(station_sname);
            const textWidth = tempText.node().getBBox().width;
            totalWidth += textWidth + 30 + padding;
            tempText.remove();
        });

        const centerOffset = (this.innerWidth - totalWidth + padding) / 2;
        let currentX = centerOffset;

        this.ietdProcessedData.forEach((stationData, i) => {
            const station_id = stationData.station;
            const station_sname = this.IETDHPCPStations[station_id].sname;

            // Create a group for each legend item
            const legendGroup = legend.append("g")
                .attr("transform", `translate(${currentX}, 0)`);

            // First, create a temporary text element to measure width
            const tempText = legendGroup.append("text")
                .attr("font-size", "10px")
                .text(station_sname);
            const textWidth = tempText.node().getBBox().width;
            const itemWidth = textWidth + 30;
            tempText.remove();

            // Add the background elements first
            legendGroup.append("circle")
                .attr("r", 4)
                .attr("cx", 6)
                .attr("cy", itemHeight/2)
                .attr("fill", this.stationColorScale(station_id));

            legendGroup.append("text")
                .attr("x", 20)
                .attr("y", itemHeight/2)
                .attr("font-size", "10px")
                .attr("alignment-baseline", "middle")
                .text(station_sname);

            // Add bounding box last so it's on top
            legendGroup.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", itemWidth)
                .attr("height", itemHeight)
                .attr("fill", "transparent")
                // .attr("stroke", "red") // for debugging
                // .attr("stroke-width", 1) // for debugging
                .style("cursor", "pointer")  // Move cursor style to the rect
                .on("mouseover", (event) => {
                    const stationObj = this.IETDHPCPStations[station_id];
                    this.mouseoverStationLegend(event, stationObj);
                })
                .on("mouseout", () => {
                    this.mouseoutStationLegend();
                })
                .on("mousemove", (event) => {
                    this.mousemoveStationLegend(event);
                });

            currentX += itemWidth + padding;
        });
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
            .text("Monthly Average Precipitation")
            .raise();
    }

    handleMouseOver(event, d, type) {

        const station = this.IETDHPCPStations[d.station];

        // Update tooltip content
        this.tooltip
            .html(`
            <div style="color:black; font-size: 10px;">
                <strong style="color:blue">Station: ${station.name} [${d.station}]</strong><br/>
                Month: ${this.monthNames[d.month]}<br/>
                Average: ${d.average.toFixed(2)}<br/>
                ${this.selectedErrorBar !== 'none' ? `Error: ±${d.error.toFixed(2)}<br/>` : ''}
                Count: ${d.count}
            </div>`)
            .style("visibility", "visible")  // Make visible
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);

        // Highlight the current station's data using sanitized station ID
        const sanitizedStation = this.sanitizeStationId(d.station);
        this.svg.selectAll(`.station-${sanitizedStation}`)
            .style("opacity", 1)
            .style("stroke-width", type === "line" ? 3 : 2);

        // Dim other stations
        this.svg.selectAll(".station-group")
            .filter(sd => this.sanitizeStationId(sd.station) !== sanitizedStation)
            .style("opacity", 0.3);
    }

    handleMouseMove(event) {
        // const tooltipWidth = this.tooltip.node().offsetWidth;
        // const mouseX = event.pageX;
        // const windowWidth = window.innerWidth;

    }

    handleMouseOut(event, d, type) {
        this.tooltip.style("visibility", "hidden");  // Hide tooltip

        // Reset all stations to normal appearance
        this.svg.selectAll(".station-group")
            .style("opacity", 1);

        this.svg.selectAll(".ietd-line")
            .style("stroke-width", 2);

        this.svg.selectAll(".ietd-point")
            .style("stroke-width", 2);
    }

    updateAxes() {
        // Update axes with transitions
        this.xAxis
            .transition()
            .duration(300)
            .attr("transform", `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale)
                .ticks(12)
                .tickFormat(d => this.monthNames[d]));

        this.yAxis
            .transition()
            .duration(300)
            .call(d3.axisLeft(this.yScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2)));


        // Update labels with transitions
        this.svg.select(".x-label")
            .transition()
            .duration(300)
            .attr("x", this.innerWidth / 2)
            .attr("y", this.innerHeight + 40);

        this.svg.select(".y-label")
            .transition()
            .duration(300)
            .attr("x", -this.innerHeight / 2)
            .attr("y", -50);

        this.svg.select(".title")
            .transition()
            .duration(300)
            .attr("x", this.innerWidth / 2)
            .attr("y", -10);
    }

    updateStationGroups() {

        // Update all station groups
        this.svg.selectAll(".station-group").each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            const sanitizedStation = this.sanitizeStationId(d.station);
            const totalStations = this.ietdProcessedData.length;

            // Create line generator specific to this station
            const line = this.createLine(i, totalStations);

            // Update line
            group.select(`.station-${sanitizedStation}`)
                .transition()
                .duration(300)
                .attr("d", d => {
                    const validData = d.monthlyData.filter(point =>
                        !isNaN(point.month) &&
                        !isNaN(point.average) &&
                        point.month !== null &&
                        point.average !== null
                    );
                    return line(validData);
                });

            // Update points
            const horizontalOffset = this.offsetConfig.getOffset(i, totalStations);
            group.selectAll(".ietd-point")
                .transition()
                .duration(300)
                .attr("cx", d => {
                    const baseX = this.xScale(d.month);
                    const offset = this.offsetConfig.getOffset(i, totalStations, d.month);
                    return baseX + offset;
                })
                .attr("cy", d => this.yScale(d.average));
        });
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

        // Update SVG dimensions - Fix the SVG selection
        const svg = container.select('svg');
        svg
            .attr("width", this.width)
            .attr("height", this.height);

        // Make sure main group exists and is positioned correctly
        let mainGroup = svg.select("g.main-group");
        if (mainGroup.empty()) {
            mainGroup = svg.append("g").attr("class", "main-group");
        }
        mainGroup.attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Update scales with new dimensions
        this.createScales();

        this.updateAxes();

        this.updateStationGroups();

        // Update error bars
        this.drawErrorBars();

        // Update legend with new position
        const legend = this.svg.select(".legend");
        if (!legend.empty()) {
            legend.remove();
            this.addLegend();
        }

        // Update controls positioning
        const yearSelectorContainer = container.select(".year-selector-container");
        if (!yearSelectorContainer.empty()) {
            yearSelectorContainer
                .style("position", "absolute")
                .style("top", "4px")
                .style("right", "30px");
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

            // Remove all error bars
            this.svg.selectAll(".error-bar").remove();

            // Remove SVG and all its child elements
            container.select("svg").remove();

            // Remove tooltip from body (not just container)
            d3.selectAll(".precipitation-tooltip").remove();

            // Remove selectors and containers
            container.select(".year-selector-container").remove();
            container.select(".error_bars_selector-container").remove();

            // Remove the offset toggle container
            d3.select(`#${this.containerId}`)
                .select(".offset-toggle-container")
                .remove();

            // Remove event listener from the checkbox to prevent memory leaks
            d3.select("#offsetToggle").on("change", null);

            // Remove any remaining groups and elements
            container.selectAll(".station-group").remove();
            container.selectAll(".error-bar").remove();
            container.selectAll(".ietd-line").remove();
            container.selectAll(".ietd-point").remove();
            container.selectAll(".x-axis, .y-axis").remove();
            container.selectAll(".x-label, .y-label").remove();
            container.selectAll(".title, .monthly").remove();
            container.selectAll(".legend").remove();

            // Remove all event listeners
            container.selectAll("*")
                .on("mouseover", null)
                .on("mousemove", null)
                .on("mouseout", null)
                .on("click", null)
                .on("change", null);

            // Clear all transitions
            container.selectAll("*").interrupt();

            // Clear all data references
            this.IETDData = null;
            this.ietdProcessedData = null;
            this.stationColorScale = null;
            this.svg = null;
            this.tooltip = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.selectedYear = null;
            this.selectedErrorBar = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.monthNames = null;
            this.offsetConfig = null;
            this.debouncedResize = null;

            // Clear any timeouts
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = null;
            }

            // Call parent's destroy method if it exists
            if (typeof super.destroy === 'function') {
                super.destroy();
            }

        } catch (error) {
            console.error('Error in destroy method:', error);
            // Attempt to continue cleanup even if there's an error
            this.IETDData = null;
            this.svg = null;
            this.tooltip = null;
        }
    }
}