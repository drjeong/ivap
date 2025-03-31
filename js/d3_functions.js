/**
 * Control map representation with openlayers
 * @author Dong Hyun Jeong <djeong@udc.edu>
 *     references: https://stackoverflow.com/questions/55789146/how-to-add-a-marker-to-openlayers-map
 *     6/19/2023 - initial version
 */

/**
 * Adding absolutely position a div over each client rect so that its border width
 * @param elt
 */
function addBoundingClientRectOverlay(elt) {
	// Absolutely position a div over each client rect so that its border width
	// is the same as the rectangle's width.
	// Note: the overlays will be out of place if the user resizes or zooms.
	// reference: https://stackoverflow.com/questions/33688549/getbbox-vs-getboundingclientrect-vs-getclientrects
	const rect = elt.getBoundingClientRect();
	const tableRectDiv = document.createElement("div");
	tableRectDiv.setAttribute("id", "BoundingClientRectOverlay");
	tableRectDiv.style.position = "absolute";
	tableRectDiv.style.border = "1px dashed #321";
	const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
	const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
	tableRectDiv.style.margin = tableRectDiv.style.padding = "0";
	// tableRectDiv.style.top = rect.top + "px";
	tableRectDiv.style.top = rect.top + scrollTop + "px";
	// tableRectDiv.style.left = rect.left + "px";
	tableRectDiv.style.left = rect.left + scrollLeft + "px";
	tableRectDiv.style.width = rect.width + "px";
	tableRectDiv.style.height = rect.height + "px";
	document.body.appendChild(tableRectDiv);
}

/**
 * Get relative position
 * @param rect
 */
const relativePosition = (rect) => {

	const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
	const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

	rect.top = rect.top + scrollTop;
	rect.left = rect.left + scrollLeft;

	return rect;
}

/**
 * Hide all overlapped labels
 * @param allDedupeLabels
 */
const dedupeLabels = (allDedupeLabels) => {
	// allDedupeLabels should contain all the objects you want to consider for de-duping
	// ex. dedupeLabels(d3.selectAll('.dedupe')
	// Use class "dedupe" when generating each object. Then add "dedupe-always-show" to things you want to show regardless (like important labels)

	// change all elements visible
	allDedupeLabels.style("opacity", "1")

	// for debugging
	// document.querySelectorAll('[id=BoundingClientRectOverlay]').forEach(e => e.remove());	// remove all BoundingClientRectOverlay

	// // A function to check whether two bounding boxes overlap
	// const getOverlapFromTwoExtents = (l, r) => {
	// 	const overlapPadding = 0
	// 	l.left = l.x - overlapPadding
	// 	l.right = l.x + l.width + overlapPadding
	// 	l.top = l.y - overlapPadding
	// 	l.bottom = l.y + l.height + overlapPadding
	// 	r.left = r.x - overlapPadding
	// 	r.right = r.x + r.width + overlapPadding
	// 	r.top = r.y - overlapPadding
	// 	r.bottom = r.y + r.height + overlapPadding
	// 	const a = l
	// 	const b = r
	//
	// 	if (a.left > b.right || a.right < b.left) return false;
	// 	if (a.bottom > b.top || a.top < b.bottom) return false;
	// 	return true;// overlapped
	//
	// 	// if (a.left >= b.right || a.top >= b.bottom ||
	// 	// 	a.right <= b.left || a.bottom <= b.top ){
	// 	// 	return false; // not overlapped
	// 	// } else {
	// 	// 	return true; // overlapped
	// 	// }
	// }

	const overlap = (R1, R2) => {
		if (  (  R1.left  <=  R2.right  )  &&  (   R1.right   >=  R2.left  )  &&
			(  R1.top  <=  R2.bottom  )  && (  R1.bottom  >= R2.top  )  )
			return true;
		return false;
	}

	// Cycle through dedupables and dedupe them
	allDedupeLabels.each(function(d, i) {

		if (d3.select(this).style("opacity") == "0") {
			return;	// skip if item is not visible
		}
		// Get bounding box
		// const thisBBox = this.getBBox();
		const thisBBox = relativePosition(this.getBoundingClientRect());

		// for debugging
		// addBoundingClientRectOverlay(this);	// add BoundingClientRectOverlay

		// Iterate through each box to see if it overlaps with any following
		// If they do, hide them
		// And only get labels later in the order than this one
		allDedupeLabels.filter((k, j) => j > i).each(function(d){
			const underBBox = relativePosition(this.getBoundingClientRect());

			if (d3.select(this).style("opacity") == "1") {
				// If not overlapping with a subsequent item, and isn't meant to be shown always, hide it
				if(overlap(thisBBox, underBBox)==true){
				// if(getOverlapFromTwoExtents(thisBBox, underBBox)==true /*&& d3.select(this).attr('class').match('dedupe-always-show') == null*/){
					d3.select(this).style('opacity', 0);	// hide current label
					// d3.select(this)
					// 	.style('opacity', 1)
					// 	.transition().delay(500).duration(1000)
					// 	.style('opacity', 0)
					// console.log("hidden:");
				}
			}


		})
	})
}

const initializeArrayWithValues = (n, val = 0) => Array(n).fill(val);


/**
 * Process D3 visualization operations asynchronously
 * @param {Array} operations - Array of operation objects with component and method properties
 * @returns {Promise} A promise that resolves when all operations are complete
 */
function processD3OperationsAsync(operations) {
	return Promise.all(
		operations.map(op =>
			new Promise(resolve => {
				setTimeout(() => {
					try {
						// Check if the component exists and the operation is applicable
						if (op.component && typeof op.method === 'function') {
							op.method();
						} else if (op.selector && op.style) {
							// Handle D3 selector operations
							const selection = d3.selectAll(op.selector);
							selection.style(op.style.property, op.style.value);
						}
					} catch (error) {
						console.error(`Error in D3 operation for ${op.name}:`, error);
					} finally {
						resolve();
					}
				}, 0);
			})
		)
	);
}

/**
 * Add highlights to D3 glyphs asynchronously
 * @param {string} indicator - The indicator to highlight
 * @param {string} color - The highlight color (default: "brown")
 * @param {number} totalelements - Total number of elements
 * @returns {Promise} A promise that resolves when all highlights are added
 */
async function addHighlightD3Glyphs(indicator, color = "brown", totalelements = 1) {
	if (totalelements > 100) return;

	try {
		// Define all operations to perform
		const operations = [
			{
				name: 'bar-highlights',
				selector: `rect.bar[data-indicator='${indicator}']`,
				style: { property: 'fill', value: color }
			},
			{
				name: 'anomaly-plot',
				component: g_plotAnomaly,
				method: () => g_plotAnomaly.addHighlights(indicator)
			}
		];

		// Add trend analysis operation conditionally
		if (g_plotTrendAnalysis)
		{
			operations.push({
				name: 'trend-analysis',
				component: g_plotTrendAnalysis,
				method: () => g_plotTrendAnalysis.addHighlights(indicator)
			});
		}

		// Process all operations in parallel
		await processD3OperationsAsync(operations);
		return true;
	} catch (error) {
		console.error('Error adding D3 highlights:', error);
		return false;
	}
}

/**
 * Remove highlights from D3 glyphs asynchronously
 * @param {string} indicator - The indicator to unhighlight
 * @param {string} color - The default color to reset to (default: "steelblue")
 * @returns {Promise} A promise that resolves when all highlights are removed
 */
async function removeHighlightD3Glyphs(indicator, color = "steelblue") {
	try {
		// Define all operations to perform
		const operations = [
			{
				name: 'bar-unhighlights',
				selector: `rect.bar[data-indicator='${indicator}']`,
				style: { property: 'fill', value: color }
			},
			{
				name: 'anomaly-plot',
				component: g_plotAnomaly,
				method: () => g_plotAnomaly.removeHighlights(indicator)
			},
			{
				name: 'trend-analysis',
				component: g_plotTrendAnalysis,
				method: () => g_plotTrendAnalysis.removeHighlights(indicator)
			}
		];

		// Process all operations in parallel
		await processD3OperationsAsync(operations);
		return true;
	} catch (error) {
		console.error('Error removing D3 highlights:', error);
		return false;
	}
}