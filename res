import jsPDF from 'jspdf';

const handleDownload = () => {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;
  
  // Helper function to add text with page break handling
  const addText = (text, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;
    
    lines.forEach((line) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    
    y += 5; // Add spacing after section
  };
  
  // Helper function to add section header
  const addSection = (title) => {
    y += 5; // Extra spacing before section
    addText(title, 14, true);
    y += 2; // Small spacing after header
  };
  
  // Process filtered array
  filteredArr?.forEach((chat, index) => {
    const { event, data: chatData } = chat;
    
    // Skip progress events if toggle is off
    const isProgressEvent = ["response.status", "response.tool_result.status",
                              "response.thinking", "response.thinking.delta",
                               "response.tool_use", "response.tool_result"].includes(event);
    if (isProgressEvent && !agentProgressToggle) {
      return;
    }
    
    if (event === "response.thinking") {
      addSection("Thinking Process:");
      addText(chatData?.text);
    }
    else if (event === "response.tool_use") {
      addSection("Tool Use:");
      addText(JSON.stringify(chatData, null, 2));
    }
    else if (event === "response.tool_result") {
      chatData?.content?.forEach((item) => {
        Object.keys(item?.json).forEach((type) => {
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
              addText(headers.join(" | "), 10, true);
              addText("-".repeat(headers.join(" | ").length));
              
              // Table rows
              dataT?.forEach((rowData) => {
                addText(rowData.join(" | "));
              });
              break;
          }
        });
      });
    }
    else if (event === "response.text") {
      addSection("Response:");
      addText(chatData?.text);
    }
  });
  
  // Save PDF
  doc.save(`agent_${timestamp}.pdf`);
};
