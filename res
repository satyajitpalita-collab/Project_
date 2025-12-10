const handleDownload = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let y = margin;
    
    // Helper function to add text with page break handling
    const addText = (text, fontSize = 10, isBold = false) => {
      if (! text) return;
      
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      
      const lines = doc. splitTextToSize(String(text), maxWidth);
      const lineHeight = fontSize * 0.5;
      
      lines.forEach((line) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      
      y += 5; // Add spacing after text
    };
    
    // Helper function to add section header
    const addSection = (title) => {
      y += 5; // Extra spacing before section
      addText(title, 14, true);
      y += 2; // Small spacing after header
    };
    
    // Helper function to add chart to PDF
    const addChartToPDF = async (chartContainer, chartTitle = "") => {
      try {
        if (!chartContainer) {
          console.warn("Chart container not found");
          return false;
        }

        // Make sure element is visible
        const originalDisplay = chartContainer.style.display;
        chartContainer.style.display = "block";

        // Wait for Vega to fully render
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Try to capture the SVG first (Vega renders as SVG)
        let imageData = null;
        const svgElement = chartContainer.querySelector("svg");

        if (svgElement && svgElement.getBoundingClientRect().width > 0) {
          // SVG exists and is visible - capture it
          const canvas = await html2canvas(svgElement, {
            backgroundColor: "#ffffff",
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
          });
          imageData = canvas. toDataURL("image/png");
        } else {
          // Fallback:  capture entire container
          const canvas = await html2canvas(chartContainer, {
            backgroundColor: "#ffffff",
            scale: 2,
            logging:  false,
            useCORS: true,
            allowTaint: true,
            removeContainer: false,
          });
          
          if (canvas.width > 0 && canvas.height > 0) {
            imageData = canvas. toDataURL("image/png");
          }
        }

        // Restore original display
        chartContainer.style.display = originalDisplay;

        if (!imageData) {
          addText("Chart:  Unable to capture chart image");
          return false;
        }

        // Calculate dimensions to fit on page
        const aspectRatio = 4 / 3; // Standard chart aspect ratio
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / aspectRatio;

        // Check if chart fits on current page
        const maxImgHeight = pageHeight - 2 * margin - 20;
        if (y + imgHeight > pageHeight - margin) {
          // Add new page if not enough space
          doc.addPage();
          y = margin;
        }

        // Adjust height if it exceeds max
        if (imgHeight > maxImgHeight) {
          imgHeight = maxImgHeight;
          imgWidth = imgHeight * aspectRatio;
        }

        // Center the image horizontally
        const xPosition = margin + (maxWidth - imgWidth) / 2;

        // Add image to PDF
        doc.addImage(imageData, "PNG", xPosition, y, imgWidth, imgHeight);
        y += imgHeight + 10; // Add spacing after chart

        console.log("Chart added successfully to PDF");
        return true;
      } catch (error) {
        console.error("Error capturing chart:", error);
        addText(`Chart: Error capturing - ${error.message}`);
        return false;
      }
    };

    let chartCounter = 0;

    // Process filtered array
    for (let i = 0; i < filteredArr?. length; i++) {
      const chat = filteredArr[i];
      const { event, data: chatData } = chat;
      
      // Skip progress events if toggle is off
      const isProgressEvent = [
        "response.status",
        "response.tool_result.status",
        "response. thinking",
        "response.thinking.delta",
        "response. tool_use",
        "response.tool_result"
      ].includes(event);

      if (isProgressEvent && ! agentProgressToggle) {
        continue;
      }
      
      if (event === "response.thinking") {
        if (agentProgressToggle) {
          addSection("Thinking Process:");
          addText(chatData?.text);
        }
      }
      else if (event === "response.tool_use") {
        if (agentProgressToggle) {
          addSection("Tool Use:");
          addText(JSON.stringify(chatData, null, 2));
        }
      }
      else if (event === "response.tool_result") {
        if (agentProgressToggle) {
          chatData?.content?.forEach((item) => {
            Object. keys(item?.json).forEach((type) => {
              const data = item?.json[type];
              
              switch (type) {
                case "sql":
                  addSection("SQL Query:");
                  addText(data);
                  break;
                  
                case "result_set": 
                  const { data: dataT, resultSetMetaData } = data;
                  addSection("Data Table:");
                  
                  // Table headers
                  const headers = resultSetMetaData?.rowType?.map((item) => item?.name);
                  if (headers && headers.length > 0) {
                    addText(headers. join(" | "), 10, true);
                    addText("-".repeat(Math.min(headers.join(" | ").length, 100)));
                    
                    // Table rows (limit to 50 rows)
                    const maxRows = 50;
                    dataT?.slice(0, maxRows).forEach((rowData) => {
                      addText(rowData.join(" | "));
                    });
                    
                    if (dataT?. length > maxRows) {
                      addText(`... and ${dataT.length - maxRows} more rows`);
                    }
                  }
                  break;
              }
            });
          });
        }
      }
      // HANDLE CHARTS FROM filteredArr
      else if (event === "response.chart") {
        addSection("Chart:");

        try {
          // Parse chart spec from data
          const spec = chatData?.chart_spec
            ?  JSON.parse(chatData. chart_spec)
            : null;

          if (spec?. title) {
            addText(spec.title, 12, true);
          }

          // Find the chart container in DOM using . vega-embed class
          // Charts are rendered by VegaEmbed into containers with this class
          const allVegaContainers = Array.from(
            document.querySelectorAll(". vega-embed")
          );

          console.log(`Found ${allVegaContainers.length} vega containers, looking for index ${chartCounter}`);

          if (allVegaContainers && allVegaContainers[chartCounter]) {
            const chartContainer = allVegaContainers[chartCounter];
            
            // Capture and add chart to PDF
            const success = await addChartToPDF(
              chartContainer,
              spec?. title || `Chart ${chartCounter + 1}`
            );

            if (! success) {
              addText("Chart: Unable to capture chart");
            }
          } else {
            addText(`Chart: Unable to locate chart in DOM (index:  ${chartCounter}, total found: ${allVegaContainers.length})`);
            console.warn(`Chart ${chartCounter} not found in DOM`);
          }

          chartCounter++;
        } catch (error) {
          console.error("Error processing chart event:", error);
          addText(`Chart: Error processing - ${error. message}`);
        }
      }
      else if (event === "response.text") {
        addSection("Response:");
        addText(chatData?.text);
      }
    }
    
    // Save PDF
    doc.save(`agent_${timestamp}.pdf`);
    alert("PDF downloaded successfully with charts!");
    
  } catch (error) {
    console.error("Error in handleDownload:", error);
    alert(`Error downloading PDF: ${error.message}`);
  }
};
