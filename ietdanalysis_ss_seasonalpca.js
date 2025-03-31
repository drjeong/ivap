class SeasonalPCAPlot extends FloatingBootboxChart {
    constructor(containerId, IETDhour, IETDData) {
        super(containerId);

        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Seasonal PCA Analysis";
        this.symbolSize = 30;  // Define symbol size as a class property

        // Get container dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Color scale for years
        const years = [...new Set(this.IETDData.map(d => new Date(d[0]).getFullYear()))];
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        this.colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([minYear, maxYear]);

        // Shape scale for seasons
        this.seasonSymbols = {
            'Spring': d3.symbolCircle,
            'Summer': d3.symbolSquare,
            'Fall': d3.symbolTriangle,
            'Winter': d3.symbolDiamond
        };

        // Bind methods
        this.resize = this.resize.bind(this);
        this.processData = this.processData.bind(this);

        // Initialize
        this.processData();
        this.init();
    }

    getSeason(date) {
        const month = date.getMonth();
        if (month >= 2 && month <= 4) return 'Spring';
        if (month >= 5 && month <= 7) return 'Summer';
        if (month >= 8 && month <= 10) return 'Fall';
        return 'Winter';
    }

    createSvg() {
        d3.select(`#${this.containerId}`).select("svg").remove();

        this.svg = d3.select(`#${this.containerId}`)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.createTooltip();
    }

    createTooltip() {
        // Create persistent tooltip with higher z-index and absolute positioning

        if (!this.tooltip) {
            this.tooltip = d3.select("body")
                .append("div")
                .attr("class", "seasonalpca-tooltip")
                .attr("color", "black")
                .style("position", "fixed")  // Change to fixed positioning
                .style("z-index", "999999")  // Very high z-index to appear above modal
                .style("visibility", "hidden")
                .style("background", "#fff")
                .style("padding", "5px")
                .style("border", "1px solid #000")
                .style("border-radius", "3px")
                .style("pointer-events", "none")
                .style("font-family", "Arial")
                .style("font-size", "11px");
        }
    }

    init() {
        // Create SVG and tooltip
        this.createSvg();
        this.createScales();
        this.createAxes();
        this.createVisualization();

        // this.addResizeListener();
        window.addEventListener('resize', () => this.resize());
    }

    // Add these methods to your chart class
    addResizeListener() {
        console.log('Adding resize listener');
        window.addEventListener('resize', this.resize);
    }

    removeResizeListener() {
        console.log('Removing resize listener');
        window.removeEventListener('resize', this.resize);
    }

    processData() {
        try {
            // Initialize feature storage
            this.seasonalFeatures = new Map();

            // Group data by year and season
            const seasonalData = new Map();

            this.IETDData.forEach(data => {
                const [start, end, volume] = data;
                const startDate = new Date(start);
                const year = startDate.getFullYear();
                const season = this.getSeason(startDate);
                const duration = (new Date(end) - startDate) / (1000 * 60 * 60);

                const key = `${year}-${season}`;
                if (!seasonalData.has(key)) {
                    seasonalData.set(key, {
                        year,
                        season,
                        events: []
                    });
                }

                seasonalData.get(key).events.push({
                    duration,
                    volume,
                    date: start  // Make sure this date is stored
                });
            });

            // Calculate features for PCA
            const featuresData = Array.from(seasonalData.values()).map(data => {
                const volumes = data.events.map(e => e.volume);
                const durations = data.events.map(e => e.duration);
                const intensities = data.events.map(e => e.volume / e.duration);

                // Calculate timing metrics (day of year for each event)
                const daysOfYear = data.events.map(e => {
                    // Make sure we have a valid date object
                    const date = e.date instanceof Date ? e.date : new Date(e.date);
                    const startOfYear = new Date(date.getFullYear(), 0, 0);
                    return Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
                });

                // Define threshold for heavy precipitation
                const heavyThreshold = volumes.length > 0 ?
                    d3.quantile([...volumes].sort(d3.ascending), 0.75) || 0 : 0;

                // Calculate features for display
                const meanVolume = d3.mean(volumes) || 0;
                const volumeSD = d3.deviation(volumes) || 0;
                const meanDuration = d3.mean(durations) || 0;
                const durationSD = d3.deviation(durations) || 0;
                const timingSpread = d3.deviation(daysOfYear) || 0;
                const heavyProportion = volumes.length > 0 ?
                    volumes.filter(v => v > heavyThreshold).length / volumes.length : 0;
                const wetDayProportion = volumes.length > 0 ?
                    volumes.filter(v => v > 0).length / volumes.length : 0;

                // Store computed features for tooltip including timing info
                const key = `${data.year}-${data.season}`;
                this.seasonalFeatures.set(key, {
                    meanVolume,
                    volumeSD,
                    meanDuration,
                    durationSD,
                    timingSpread,
                    meanDayOfYear: d3.mean(daysOfYear) || 0,
                    heavyProportion,
                    wetDayProportion,
                    eventCount: data.events.length,
                    totalPrecipitation: d3.sum(volumes) || 0,
                    maxEvent: d3.max(volumes) || 0,
                    meanIntensity: d3.mean(intensities) || 0
                });

                return {
                    year: data.year,
                    season: data.season,
                    features: [
                        meanVolume,                      // Mean precipitation volume
                        volumeSD,                        // Standard deviation of volumes
                        meanDuration,                    // Mean event duration
                        durationSD,                      // Standard deviation of durations
                        timingSpread,                    // Spread of events across the season
                        heavyProportion,                 // Proportion of heavy events
                        wetDayProportion                 // Proportion of wet days
                    ]
                };
            });


            // Check for and handle invalid values first
            for (let i = 0; i < featuresData.length; i++) {
                for (let j = 0; j < featuresData[i].features.length; j++) {
                    // Replace NaN, Infinity, -Infinity with 0
                    if (!isFinite(featuresData[i].features[j])) {
                        featuresData[i].features[j] = 0;
                    }
                }
            }

            // Extract features from data
            const features = featuresData.map(d => d.features);

            // Check if we have enough data
            if (features.length === 0 || features[0].length === 0) {
                console.error("Not enough data for PCA");
                return;
            }

            // Calculate means and standard deviations properly
            const means = [];
            const stds = [];

            for (let i = 0; i < features[0].length; i++) {
                const column = features.map(row => row[i]);
                const mean = d3.mean(column) || 0;
                let std = d3.deviation(column) || 0;

                // Handle zero variance features (prevent division by zero)
                if (std === 0) {
                    std = 1;  // Set to 1 to effectively not scale this feature
                }

                means.push(mean);
                stds.push(std);
            }

            // Standardize features
            const standardizedFeatures = features.map(row =>
                row.map((val, i) => (val - means[i]) / stds[i]));

            // Check standardized features for any remaining issues
            for (let i = 0; i < standardizedFeatures.length; i++) {
                for (let j = 0; j < standardizedFeatures[i].length; j++) {
                    if (!isFinite(standardizedFeatures[i][j])) {
                        standardizedFeatures[i][j] = 0; // Replace any remaining NaN/Infinity values
                    }
                }
            }

            // Feature importance analysis before PCA
            const variances = stds.map(std => std * std);
            const totalVariance = d3.sum(variances);
            const featureImportance = variances.map(v => v / totalVariance);

            // console.log("Feature importance before PCA:", featureImportance);

            // Now perform PCA on clean data
            const pca = this.performPCA(standardizedFeatures);

            // Project data onto first two principal components
            this.formattedData = featuresData.map((d, i) => ({
                year: d.year,
                season: d.season,
                x: pca.projections[i][0],
                y: pca.projections[i][1]
            }));

            // Calculate axis ranges
            this.xExtent = d3.extent(this.formattedData, d => d.x);
            this.yExtent = d3.extent(this.formattedData, d => d.y);

            // Add some padding to the extents
            const xPadding = (this.xExtent[1] - this.xExtent[0]) * 0.1;
            const yPadding = (this.yExtent[1] - this.yExtent[0]) * 0.1;
            this.xExtent = [this.xExtent[0] - xPadding, this.xExtent[1] + xPadding];
            this.yExtent = [this.yExtent[0] - yPadding, this.yExtent[1] + yPadding];

        } catch (error) {
            console.error('Error processing data:', error);
            this.formattedData = [];
        }
    }

    performPCA(data, numComponents = 2) {
        try {
            // 1. Data should already be standardized from your previous step

            // 2. Compute the covariance matrix
            const n = data.length;
            const d = data[0].length;
            const cov = Array(d).fill().map(() => Array(d).fill(0));

            for (let i = 0; i < d; i++) {
                for (let j = 0; j < d; j++) {
                    let sum = 0;
                    for (let k = 0; k < n; k++) {
                        sum += data[k][i] * data[k][j];
                    }
                    cov[i][j] = sum / (n - 1);
                }
            }

            // 3. Calculate eigenvalues - jStat 1.9.6 doesn't have this built-in functionality
            // We'll use power iteration to find the principal components directly

            // First component
            const pc1 = this.powerIteration(cov);

            // Second component - orthogonal to first (using deflation)
            const deflatedCov = this.deflateMatrix(cov, pc1);
            const pc2 = this.powerIteration(deflatedCov);

            // 4. Project data onto principal components
            const projections = data.map(row => [
                row.reduce((sum, val, i) => sum + val * pc1[i], 0),
                row.reduce((sum, val, i) => sum + val * pc2[i], 0)
            ]);

            // 5. Calculate approximate explained variance
            // This is a rough approximation since we haven't directly computed eigenvalues
            const totalVar = this.calculateTotalVariance(cov);
            const var1 = this.calculateComponentVariance(data, pc1);
            const var2 = this.calculateComponentVariance(data, pc2);

            const explainedVarianceRatio = [
                var1 / totalVar,
                var2 / totalVar
            ];

            return {
                components: [pc1, pc2],
                projections,
                explainedVarianceRatio
            };
        } catch (error) {
            console.error("Error in PCA computation:", error);
            // Return empty projections as fallback
            return {
                components: [],
                projections: data.map(() => [0, 0]),
                explainedVarianceRatio: [0, 0]
            };
        }
    }


// Deflate the matrix to find orthogonal components
    deflateMatrix(matrix, eigenvector) {
        const n = matrix.length;
        const result = Array(n).fill().map(() => Array(n).fill(0));

        // Calculate outer product of eigenvector
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Calculate the outer product term
                const outerProduct = eigenvector[i] * eigenvector[j];

                // Calculate eigenvalue using Rayleigh quotient
                let rayleigh = 0;
                for (let p = 0; p < n; p++) {
                    for (let q = 0; q < n; q++) {
                        rayleigh += eigenvector[p] * matrix[p][q] * eigenvector[q];
                    }
                }

                // Deflate the matrix
                result[i][j] = matrix[i][j] - rayleigh * outerProduct;
            }
        }

        return result;
    }

// Calculate total variance (sum of diagonal elements of covariance matrix)
    calculateTotalVariance(covMatrix) {
        let sum = 0;
        for (let i = 0; i < covMatrix.length; i++) {
            sum += covMatrix[i][i];
        }
        return sum;
    }

// Calculate variance explained by a component
    calculateComponentVariance(data, component) {
        // Project data onto component
        const projection = data.map(row =>
            row.reduce((sum, val, i) => sum + val * component[i], 0)
        );

        // Calculate variance of projection
        const mean = jStat.mean(projection);
        const variance = jStat.variance(projection, true);

        return variance;
    }

    powerIteration(matrix, iterations = 100) {
        let vector = Array(matrix.length).fill(1);

        for (let i = 0; i < iterations; i++) {
            // Multiply matrix by vector
            const newVector = matrix.map(row =>
                row.reduce((sum, val, j) => sum + val * vector[j], 0));

            // Normalize
            const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
            vector = newVector.map(val => val / norm);
        }

        return vector;
    }

    createColorYearLegend(legendGroup) {

        // Year Legend First
        const yearLegend = legendGroup.append("g")
            .attr("class", "year-legend");

        const legendHeight = 10;
        const legendWidth = 150;

        // Create gradient
        const defs = this.svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "rainbow-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        // Add color stops
        const years = [...new Set(this.IETDData.map(d => new Date(d[0]).getFullYear()))];
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        this.colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([minYear, maxYear]);

        const stops = d3.range(0, 1.1, 0.1);

        stops.forEach(stop => {
            gradient.append("stop")
                .attr("offset", `${stop * 100}%`)
                .attr("stop-color", this.colorScale(minYear + (maxYear - minYear) * stop));
        });

        // Add gradient rectangle
        yearLegend.append("rect")
            .attr("y", -5)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#rainbow-gradient)");

        // Add vertical divider lines and invisible hover areas for each year
        const yearRange = maxYear - minYear;
        years.forEach(year => {
            const lineX = ((year - minYear) / yearRange) * legendWidth;

            // Add divider line
            yearLegend.append("line")
                .attr("x1", lineX)
                .attr("x2", lineX)
                .attr("y1", -7)
                .attr("y2", 7)
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .style("opacity", 0.5);

            // Add invisible hover area
            const hoverWidth = legendWidth / years.length;
            const hoverX = Math.max(0, lineX - hoverWidth/2);

            yearLegend.append("rect")
                .attr("x", hoverX)
                .attr("y", -7)
                .attr("width", hoverWidth)
                .attr("height", 14)
                .attr("fill", "transparent")
                .style("cursor", "pointer")
                .on("mouseover", () => {
                    // Dim all points and labels
                    this.mainGroup.selectAll(".seasonalpca_point, .point-label")
                        .style("opacity", 0.1);

                    // Highlight points from this year
                    this.mainGroup.selectAll(`.seasonalpca_point.year-${year}`)
                        .style("opacity", 1)
                        .style("stroke", "black")
                        .style("stroke-width", "2px");

                    // Highlight labels from this year
                    this.mainGroup.selectAll(`.point-label.year-${year}`)
                        .style("opacity", 1);

                    // Add temporary year label
                    yearLegend.append("text")
                        .attr("class", "temp-year-label")
                        .attr("x", lineX)
                        .attr("y", -10)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "10px")
                        .text(year);
                })
                .on("mouseout", () => {
                    // Reset all points
                    this.mainGroup.selectAll(".seasonalpca_point")
                        .style("opacity", 1)
                        .style("stroke", "black")
                        .style("stroke-width", "1px");

                    // Reset all labels
                    this.mainGroup.selectAll(".point-label")
                        .style("opacity", 1)
                        .style("fill", d => this.colorScale(d.year)); // Reset to original color

                    // Remove temporary year label
                    yearLegend.selectAll(".temp-year-label").remove();
                });
        });

        // Add year labels
        yearLegend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 8)
            .attr("font-size", "10px")
            .text(minYear);

        yearLegend.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 8)
            .attr("font-size", "10px")
            .attr("text-anchor", "end")
            .text(maxYear);

        return legendWidth;
    }

    createScales() {
        this.xScale = d3.scaleLinear()
            .domain(this.xExtent)
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain(this.yExtent)
            .range([this.innerHeight, 0]);
    }

    createAxes() {
        // First, remove any existing main group to prevent duplication
        this.svg.selectAll("g.main-group").remove();

        // Create new main group with a class for easier selection later
        this.mainGroup = this.svg.append("g")
            .attr("class", "main-group")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // X-axis - remove any existing first
        this.mainGroup.selectAll(".x.axis").remove();
        this.xAxis = this.mainGroup.append("g")
            .attr("class", "x axis")
            .attr("color", "black")
            .attr("transform", `translate(0, ${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale));

        // Y-axis - remove any existing first
        this.mainGroup.selectAll(".y.axis").remove();
        this.yAxis = this.mainGroup.append("g")
            .attr("class", "y axis")
            .attr("color", "black")
            .call(d3.axisLeft(this.yScale));

        // Remove existing labels before creating new ones
        this.mainGroup.selectAll(".x-label").remove();
        this.mainGroup.selectAll(".y-label").remove();
        this.mainGroup.selectAll(".title").remove();

        // X-axis label (positioned to the right)
        this.mainGroup.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("x", this.innerWidth - 10)  // Position it right of the chart
            .attr("y", this.innerHeight + 40)  // Align with the x-axis
            .text("PC1");

        // Y-axis label (positioned at the top)
        this.mainGroup.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .attr("x", -20)  // Start from the left edge
            .attr("y", -45)  // Position above the chart
            .text("PC2");  // Shortened text

        // Title with IETD hour
        const titleText = `${this.title}`;
        this.mainGroup.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", this.innerWidth / 2)
            .attr("y", -5)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(titleText);
    }

    dedupeLabels(labels) {
        // First check if there are any labels
        if (labels.empty()) return;

        // Get the SVG element
        // Instead of looking for SVG in a specific container, use the parent of the labels
        const svg = labels.node().closest('svg');
        if (!svg) return;

        // Create a helper function to get transformed coordinates
        const getTransformedCoords = (element) => {
            const bbox = element.getBBox();
            const matrix = element.getScreenCTM();
            if (!matrix) return null;

            const point = svg.createSVGPoint();
            point.x = bbox.x;
            point.y = bbox.y;
            const transformed = point.matrixTransform(matrix);

            return {
                x: transformed.x,
                y: transformed.y,
                width: bbox.width,
                height: bbox.height
            };
        };

        // Wait for a brief moment to ensure SVG elements are rendered
        setTimeout(() => {
            const rects = [];

            labels.each(function(d) {
                const coords = getTransformedCoords(this);
                if (!coords) return;

                rects.push({
                    x: coords.x,
                    y: coords.y,
                    width: coords.width,
                    height: coords.height,
                    element: this,
                    visible: true,
                    text: d.year
                });
            });

            // Sort by y position (top to bottom)
            rects.sort((a, b) => a.y - b.y);

            // Add padding around boxes
            const padding = 2;

            for (let i = 0; i < rects.length; i++) {
                const curr = rects[i];

                // Check overlap with all previous visible labels
                for (let j = 0; j < i; j++) {
                    const prev = rects[j];
                    if (!prev.visible) continue;

                    // Check for overlap with padding
                    const overlap = !(
                        (curr.x + curr.width + padding) < (prev.x - padding) ||
                        (curr.x - padding) > (prev.x + prev.width + padding) ||
                        (curr.y + curr.height + padding) < (prev.y - padding) ||
                        (curr.y - padding) > (prev.y + prev.height + padding)
                    );

                    if (overlap) {
                        d3.select(curr.element).remove();
                        curr.visible = false;
                        break;
                    }
                }
            }
        }, 100); // Increased timeout to ensure elements are rendered
    }

    createVisualization() {
        // Create symbol generators
        const symbolGenerators = Object.fromEntries(
            Object.entries(this.seasonSymbols).map(([season, symbol]) => [
                season,
                d3.symbol().type(symbol).size(this.symbolSize)
            ])
        );

        // Create tooltip if it doesn't exist
        this.createTooltip();

        // Add new points
        this.mainGroup.selectAll(".point")
            .data(this.formattedData)
            .enter()
            .append("path")
            .attr("class", d => `seasonalpca_point year-${d.year}`) // Add multiple classes
            .attr("d", d => symbolGenerators[d.season]())
            .attr("fill", d => this.colorScale(d.year))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("transform", d => `translate(${this.xScale(d.x)},${this.yScale(d.y)})`)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Add new labels (using a different selector)
        this.mainGroup.selectAll(".point-label")  // Changed selector
            .data(this.formattedData)
            .enter()
            .append("text")
            .attr("class", d => `point-label year-${d.year}`)  // Add year class to labels too
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", d => this.colorScale(d.year))
            .attr("x", d => this.xScale(d.x))
            .attr("y", d => this.yScale(d.y) - 10)
            .text(d => d.year);

        // Handle label overlapping
        this.dedupeLabels(this.mainGroup.selectAll(".point-label"));

        this.createLegend();
    }

    createLegend() {

        // Create legend for seasons and years at the bottom
        const legendY = this.innerHeight + 30; // Position below x-axis label
        const seasonSpacing = 60; // Space between season legend items
        const spacer = 40; // Space between year and season legends

        // Calculate total width needed for season legend
        const totalSeasonWidth = Object.keys(this.seasonSymbols).length * seasonSpacing;
        const yearLegendWidth = 150; // Width of the year color legend

        // Create a group for all legends
        const legendGroup = this.mainGroup.append("g")
            .attr("class", "combined-legend")
            .attr("transform", `translate(0, ${legendY})`);

        // Create color legend within the year legend group
        this.createColorYearLegend(legendGroup);

        // Season Legend Second
        const seasonLegend = legendGroup.append("g")
            .attr("class", "season-legend")
            .attr("transform", `translate(${yearLegendWidth + spacer}, 0)`);

        Object.entries(this.seasonSymbols).forEach(([season, symbol], i) => {
            const group = seasonLegend.append("g")
                .attr("transform", `translate(${i * seasonSpacing}, 0)`);

            group.append("path")
                .attr("d", d3.symbol().type(symbol).size(this.symbolSize)())
                .attr("transform", "translate(0, 0)")
                .attr("fill", "gray")
                .attr("stroke", "black");

            group.append("text")
                .attr("x", 8)
                .attr("y", 2)
                .attr("font-size", "10px")
                .style("alignment-baseline", "middle")
                .text(season);
        });

        // Center both legends
        const totalWidth = yearLegendWidth + spacer + totalSeasonWidth;
        const legendStartX = (this.innerWidth - totalWidth) / 2;

        legendGroup.attr("transform", `translate(${legendStartX}, ${legendY})`);
    }

    handleMouseOver(event, d) {
        // Highlight point
        d3.select(event.target)
            .raise() // Brings element to front
            .attr("stroke-width", 2)
            .attr("stroke", "#333")
            .attr("fill", "brown");

        // Get mouse coordinates relative to the viewport
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Get the features for this season-year
        const key = `${d.year}-${d.season}`;
        const features = this.seasonalFeatures.get(key);

        if (!features) {
            // Fallback if features not found
            this.tooltip
                .html(`
            <div style="color:black; padding: 3px; border-radius: 8px;">
                <span style="color:blue">${d.season} ${d.year}</span><br/>
                PC1: ${d.x.toFixed(3)}<br/>
                PC2: ${d.y.toFixed(3)}
            </div>`)
                .style("visibility", "visible")
                .style("top", `${mouseY - 10}px`)
                .style("left", `${mouseX + 10}px`);
            return;
        }

        // Format values for display
        const format = (num) => num.toFixed(1);
        const formatPercent = (num) => (num * 100).toFixed(0) + '%';

        // Convert mean day of year to a readable date format
        const formatDayOfYear = (dayNum) => {
            if (!dayNum) return "N/A";
            const date = new Date(d.year, 0);
            date.setDate(Math.round(dayNum));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        // Create tooltip content
        let tooltipContent = `
        <div style="color:black; padding: 8px; border-radius: 8px; max-width: 300px;">
            <h6 style="margin: 0 0 6px 0; color:blue; font-size: 11px;">${d.season} ${d.year}</h6>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 10px;">
                <div>
                    <p style="margin: 0;"><b>Precipitation</b></p>
                    <p style="margin: 0;">Total: ${format(features.totalPrecipitation)}</p>
                    <p style="margin: 0;">Mean Vol: ${format(features.meanVolume)}</p>
                    <p style="margin: 0;">Vol SD: ${format(features.volumeSD)}</p>
                    <p style="margin: 0;">Max Event: ${format(features.maxEvent)}</p>
                </div>
                <div>
                    <p style="margin: 0;"><b>Event Pattern</b></p>
                    <p style="margin: 0;">Count: ${features.eventCount}</p>
                    <p style="margin: 0;">Mean Duration: ${format(features.meanDuration)}h</p>
                    <p style="margin: 0;">Heavy Events: ${formatPercent(features.heavyProportion)}</p>
                    <p style="margin: 0;">Timing: ${formatDayOfYear(features.meanDayOfYear)}</p>
                    <p style="margin: 0;">Spread: ${format(features.timingSpread)} days</p>
                </div>
            </div>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">PCA: [${d.x.toFixed(2)}, ${d.y.toFixed(2)}]</p>
        </div>`;


        // Get mouse position relative to the chart container
        // Determine if mouse is in right half of chart
        const isRightHalf = (event.clientX - this.svg.node().getBoundingClientRect().left) > this.innerWidth / 2;

        // Get tooltip element to calculate its width
        const tooltipNode = this.tooltip.node();
        const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 150; // 150px as fallback

        this.tooltip
            .html(tooltipContent)
            .style("visibility", "visible")
            .style("top", `${mouseY - 10}px`)
            .style("left", isRightHalf ?
                (event.pageX - tooltipWidth - 10) + "px" : // Left of cursor if on right half
                (event.pageX + 10) + "px");               // Right of cursor if on left half
    }


    handleMouseOut(event, d) {
        // Reset point style
        d3.select(event.target)
            .attr("stroke-width", 1)
            .attr("stroke", "black")
            .style("filter", "none")
            .attr("fill", d => this.colorScale(d.year));

        if (this.tooltip) {
            this.tooltip.style("visibility", "hidden");
        }
    }


    resize() {
        // Check if the container is visible
        if (!this.isVisible()) return;

        // Check if the floating window is visible
        if (this.isFloatingWindowVisible()===true) return;

        // Update dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));

        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Update SVG
        this.svg
            .attr("width", this.width)
            .attr("height", this.height);

        // Update scales
        this.xScale.range([0, this.innerWidth]);
        this.yScale.range([this.innerHeight, 0]);

        // Update axes
        this.updateAxes();

        this.mainGroup.select(".title")
            .attr("x", this.innerWidth / 2);

        // Redraw visualization (which now includes legend recreation)
        this.redrawVisualization();
    }

    openFloatingChart(width, height) {

        this.resizeFloatingChart(width, height);
    }

    closeFloatingChart() {
        this.createSvg();
        this.createScales();
        this.createAxes();
        this.resize();
    }

    resizeFloatingChart(width, height) {
        this.width = width;
        this.height = height;

        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Update SVG
        this.svg
            .attr("width", this.width)
            .attr("height", this.height);

        // Update scales
        this.xScale.range([0, this.innerWidth]);
        this.yScale.range([this.innerHeight, 0]);

        // Update axes
        this.updateAxes();

        // Update labels
        this.updateLabels();

        // Update title
        this.mainGroup.select(".title")
            .attr("x", this.innerWidth / 2);

        this.redrawVisualization();

        // Reattach event listeners to points
        this.svg.selectAll(".seasonalpca_point")
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));
    }

    updateAxes() {
        this.xAxis
            .attr("transform", `translate(0, ${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale));
        this.yAxis.call(d3.axisLeft(this.yScale));
    }

    updateLabels() {
        this.mainGroup.select(".x-label")
            .attr("x", this.innerWidth - 20)
            .attr("y", this.innerHeight + 40);

        this.mainGroup.select(".y-label")
            .attr("x", -20)
            .attr("y", -45);
    }

    async updateData(newIETDData, newIETDHour) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;
        this.processData();
        this.createScales();

        this.redrawVisualization();
    }

    redrawVisualization() {

        // Remove all existing elements first
        this.mainGroup.selectAll(".seasonalpca_point").remove();
        this.mainGroup.selectAll(".point-label").remove();
        this.mainGroup.select(".combined-legend").remove(); // Add this line to remove existing legend
        this.svg.select(".no-data-message").remove();

        // Check if how many data elements
        // Count distinct years in the formatted data
        const distinctYears = new Set(this.formattedData.map(d => d.year)).size;
        if (distinctYears <= 2) {
            // Add message in the middle of the chart
            this.svg.append("text")
                .attr("class", "no-data-message")
                .attr("x", this.margin.left + this.innerWidth / 2)
                .attr("y", this.innerHeight / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .style("fill", "#666")
                .text("Not enough data!");

            return;
        }

        // Update axes
        this.xAxis.transition().duration(500)
            .call(d3.axisBottom(this.xScale));
        this.yAxis.transition().duration(500)
            .call(d3.axisLeft(this.yScale));

        // Create symbol generators
        const symbolGenerators = Object.fromEntries(
            Object.entries(this.seasonSymbols).map(([season, symbol]) => [
                season,
                d3.symbol().type(symbol).size(this.symbolSize)
            ])
        );

        // Add new points
        this.mainGroup.selectAll(".point")
            .data(this.formattedData)
            .enter()
            .append("path")
            .attr("class", d => `seasonalpca_point year-${d.year}`) // Add multiple classes
            .attr("d", d => symbolGenerators[d.season]())
            .attr("fill", d => this.colorScale(d.year))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("transform", d => `translate(${this.xScale(d.x)},${this.yScale(d.y)})`)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Add new labels (using a different selector)
        this.mainGroup.selectAll(".point-label")  // Changed selector
            .data(this.formattedData)
            .enter()
            .append("text")
            .attr("class", d => `point-label year-${d.year}`)  // Add year class to labels too
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", d => this.colorScale(d.year))
            .attr("x", d => this.xScale(d.x))
            .attr("y", d => this.yScale(d.y) - 10)
            .text(d => d.year);

        // Handle label overlapping
        this.dedupeLabels(this.mainGroup.selectAll(".point-label"));

        // Update title
        this.mainGroup.select(".title").text(`${this.title}`);

        // Create new legend
        this.createLegend();
    }

    destroy() {
        try {
            // Remove window event listener
            window.removeEventListener('resize', this.resize);

            // Get container
            const container = d3.select(`#${this.containerId}`);

            // Remove SVG and all its child elements
            container.select("svg").remove();

            // Remove tooltip
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }

            // Remove specific elements
            container.selectAll(".seasonalpca_point").remove();
            container.selectAll(".point-label").remove();
            container.selectAll(".season-legend").remove();
            container.selectAll(".x.axis").remove();
            container.selectAll(".y.axis").remove();
            container.selectAll(".x-label").remove();
            container.selectAll(".y-label").remove();
            container.selectAll(".title").remove();
            container.selectAll(".no-data-message").remove();
            container.selectAll(".mainGroup").remove();

            // Remove gradient definition
            this.svg.select("defs").remove();

            // Remove all event listeners from points
            container.selectAll(".seasonalpca_point")
                .on("mouseover", null)
                .on("mouseout", null);

            // Clear all data references
            this.formattedData = null;
            this.IETDData = null;
            this.IETDhour = null;
            this.svg = null;
            this.mainGroup = null;
            this.tooltip = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.colorScale = null;
            this.seasonSymbols = null;
            this.xExtent = null;
            this.yExtent = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.symbolSize = null;

            // Clear matrix-related data
            this.symbolGenerators = null;
            this.projections = null;
            this.components = null;

            // Call parent's destroy method last
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}
