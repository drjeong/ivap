class ChartCommons {
    constructor(containerId) {
        this.containerId = containerId;
        this._visible = true;
    }

    createTooltipFormat(d, content) {
        return `
            <div style="
                padding: 6px; 
                border-radius: 8px; 
                border: 1px solid black; 
                background: white; 
                overflow: hidden;
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: black;
                text-align: left;">
                ${content}
            </div>`;
    }

    createHideButton() {
        // Create a separate container for the button outside the main chart container
        this.buttonContainer = d3.select(`#${this.containerId}`)
            .append("div")
            .attr("class", "toggle-button-container")
            .style("position", "absolute")
            .style("right", "0")
            .style("top", "0");

        // Create SVG for the button
        const buttonSvg = this.buttonContainer
            .append("svg")
            .attr("width", 40)
            .attr("height", 18);

        const buttonGroup = buttonSvg.append("g")
            .attr("class", "toggle-button")
            .style("cursor", "pointer")
            .on("click", () => this.toggleVisibility());

        // Button background
        buttonGroup.append("rect")
            .attr("width", 40)
            .attr("height", 18)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("opacity", 0.9);

        // Button text
        buttonGroup.append("text")
            .attr("class", "button-text")
            .attr("x", 20)
            .attr("y", 13)
            .attr("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-size", "11px")
            .attr("fill", "#666")
            .text("Hide");

        // Hover effects
        buttonGroup.on("mouseover", function() {
            d3.select(this).select("rect")
                .attr("fill", "#f0f0f0");
        })
            .on("mouseout", function() {
                d3.select(this).select("rect")
                    .attr("fill", "white");
            });
    }

    getHideButtonPosition() {
        const rightEdge = this.margin.left + this.innerWidth;
        return `translate(${rightEdge - 40}, ${this.margin.top})`;
    }

    updateHideButtonPosition() {
        this.svg.select(".toggle-button")
            .transition()
            .duration(750)
            .attr("transform", this.getHideButtonPosition());
    }

    toggleVisibility() {
        this._visible = !this._visible;

        // Update button text
        this.buttonContainer.select(".button-text")
            .text(this._visible ? "Hide" : "Show");

        // Toggle main container visibility
        const container = d3.select(`#${this.containerId}`);
        const mainContent = container.select("svg:not(.toggle-button-container svg)");

        if (this._visible) {
            mainContent
                .style("display", "block")
                .style("opacity", 0)
                .transition()
                .duration(300)
                .style("opacity", 1);
        } else {
            mainContent
                .transition()
                .duration(300)
                .style("opacity", 0)
                .on("end", () => {
                    mainContent.style("display", "none");
                });
        }
    }
    updateButtonPosition() {
        // Update button container position if needed
        const container = d3.select(`#${this.containerId}`);
        const containerBounds = container.node().getBoundingClientRect();

        this.buttonContainer
            .style("top", `${containerBounds.top}px`)
            .style("right", `${window.innerWidth - containerBounds.right}px`);
    }
    isVisible() {
        const element = document.getElementById(this.containerId);
        if (!element) return false;

        return (
            element.offsetParent !== null &&
            window.getComputedStyle(element).display !== 'none' &&
            window.getComputedStyle(element).visibility !== 'hidden'
        );
    }

    destroy() {
        if (this.svg) {
            this.svg.select(".toggle-button").remove();
        }
    }
}