import React, { useEffect, useState } from "react";
import { fetchToken } from "../../Auth";
import Thumbsdown from "../../../assets/CoversationSectionIcon/Thumbsdown.png";
import Thumbsup from "../../../assets/CoversationSectionIcon/Thumbsup.png";
import { Box, Stack, useTheme, IconButton } from "@mui/material";
import copy from "../../../assets/CoversationSectionIcon/Copy.png";
import download from "../../../assets/CoversationSectionIcon/Download.png";
import read from "../../../assets/CoversationSectionIcon/Read.png";
import sound from "../../../assets/CoversationSectionIcon/sound.png";
import downloaddark from "../../../assets/CoversationSectionIcon/downloaddark.png";
import copydark from "../../../assets/CoversationSectionIcon/copydark.png";
import thumbsdowndark from "../../../assets/CoversationSectionIcon/thumbsdowndark.png";
import thumbsupdark from "../../../assets/CoversationSectionIcon/thumbsupdark.png";
//import { getBaseURLIntelliQ, getBaseURLMedRFE } from "../configLoader";
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import { useAppUrl } from "../../../helpers/hooks/hooks";
import { abortcontrollerRefAtom, agentProgressToggleAtom } from "../../../helpers";
import { useAtom } from "jotai";

const AgentChatBotFeedback = ({
  response,
  userId,
  queryId,
  prompt,
  query,
  contentRef,
  contentTableRef,
  contentSumm,
  disableCopy,
  disableDownload,
  summType,
  dataType,
  isSql,
  summary,
  dataGrid,
  titleSql,
  childMethod,
  summaryData,
  rows,
  columns,
  sqlprompt,
  sqlquery,
  graph,
  chatError,
  content,
  loading,
  data,
  progState=false,
  // content
}) => {
   const [agentProgressToggle,setAgentProgressToggle]=useAtom(agentProgressToggleAtom)
  const [feedback, setFeedback] = useState(null); // 'like', 'dislike', or null
  const [comment, setComment] = useState(""); // Optional feedback comment
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if feedback is submitted
  const [isLoading, setIsLoading] = useState(false); // Track API call loading state
  const [error, setError] = useState(null); // Track API call errors
  const [sqlPrompt, setSqlPrompt] = useState("");
  const API_DEV_URL = process.env.REACT_APP_BASE_URL;
  const [abortcontrollerRef,setAbortcontrollerRef]=useAtom(abortcontrollerRefAtom);
  //const baseUrlIntelliQ = useAppUrl();
  const theme = useTheme();
  const textColor = theme.palette.mode === "dark" ? "#FFF" : "#231E33";
  const downloadsrc = theme.palette.mode === "dark" ? downloaddark : download;
  const readsrc = theme.palette.mode === "dark" ? sound : read;
  const copysrc = theme.palette.mode === "dark" ? copydark : copy;
  const thumbsupsrc = theme.palette.mode === "dark" ? thumbsupdark : Thumbsup;
  const thumbsdownsrc =
    theme.palette.mode === "dark" ? thumbsdowndark : Thumbsdown;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const { API_BASE_URL } = useAppUrl();
  let filteredArr = data?.filter(
    (item, index) =>
      !["response.status", "response.tool_result.status"].includes(
        item.event
      ) || index === data.length - 1
  );

  // Handle Like/Dislike click
  const handleFeedbackClick = (type) => {
    setFeedback(type);
  };

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        const enUSVoices = voices.filter(
          (v) => v.lang === "en-US" && v.name === "Google US English"
        );
        setAvailableVoices(enUSVoices);
        console.log("Loaded voices: ", enUSVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  function sanitizeText(input) {
    return input
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/#\w+/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[`~*#_\[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // const convertToHTML = (text) => {
  //   // Split the text by lines
  //   const lines = text.split('\n');

  //   // Map through each line and convert to HTML
  //   return lines.map((line, index) => {
  //     if (line.startsWith('**')) {

  //       // Replace ** with <h2> for main headers
  //       return line.replace(/\*\*/g, '').trim();

  //     } else if (line.startsWith('*')) {
  //       // Replace * with <li> for subpoints
  //       return line.replace(/\*/g, '').trim();
  //     }
  //     else if (/^\d+\.\s*\*\*/.test(line.trim())) {
  //       const number=line.trim().match(/^\d+\./)?.[0];
  //       const content=line.trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
  //       // Replace * with <li> for subpoints
  //       return `${content}`;
  //     }
  //     else if (line.startsWith('\t+')) {

  //       // Replace \t+ with <ul> for subpoints
  //       return line.replace(/^\t\+/, '').trim();
  //     }
  //     else {
  //       // Return plain text for other lines
  //       return line.trim();
  //     }
  //   });
  // };

  const formatAllDataForClipboard = (mainTitle, grids) => {
      console.log('line 144',grids);
    const formattedGrids = grids
      .map((grid) => {
        const { columnData, referralList } = grid;

        // Calculate the maximum width for each column
        const colWidths = columnData.map((col) => {
          return Math.max(
            col.headerName.length,
            ...referralList.map((row) => (row[col.field] || "").length)
          );
        });

        // Function to pad strings manually
        const padString = (str, length) => {
          return str + " ".repeat(length - str.length);
        };

        // Format the headings with proper alignment
        const headings = columnData
          .map((col, index) => padString(col.headerName, colWidths[index]))
          .join("\t");

        // Format each row with proper alignment
        const rows = referralList
          .map((row) => {
            return columnData
              .map((col, index) =>
                padString(row[col.field] || "", colWidths[index])
              )
              .join("\t");
          })
          .join("\n");

        return `${headings}\n${rows}`;
      })
      .join("\n\n");

    return `${mainTitle}\n\n${formattedGrids}`;
  };

  const copyToClipboard = (column, row) => {
    const mainTitle = "Here is the Data Table";
    const grids = [
      {
        columnData: column,
        referralList: row,
      },
    ];
    return formatAllDataForClipboard(mainTitle, grids);
    // navigator.clipboard.writeText(formattedData);
    //const text=codeRef.current.textContent;
    // navigator.clipboard.writeText(text);
    //console.log('from chat bubble',text);
  };

  const handleCopy = () => {
    let a = "";
    let b = "";
    let c = "";
    let d = "";
    let t = "";
    filteredArr?.forEach((chat, index) => {
      const { event, data: chatData } = chat;
      const isProgressEvent = ["response.status", "response.tool_result.status",
                                "response.thinking", "response.thinking.delta",
                                 "response.tool_use", "response.tool_result"].includes(event);
      if (isProgressEvent&& !agentProgressToggle){
        return;
      }
      if (event == "response.thinking") {
        a += chatData?.text;
      } else if (event === "response.tool_use") {
        const jsonObject = chatData;
        b += JSON.stringify(jsonObject, null, 2);
      } else if (event === "response.tool_result") {
        chatData?.content?.forEach((item, index) => {
          Object.keys(item?.json).forEach((type) => {
            const data = item?.json[type];
            console.log("line 187", type);
            switch (type) {
              case "sql":
                return (c += data);
              case "result_set":
                const { data:dataT, resultSetMetaData } = data;
                const columnsArr = resultSetMetaData?.rowType?.map(
                  (tableData) => {
                    return {
                      field: tableData.name,
                      headerName: tableData.name,
                      width: 150,
                      editable: false,
                    };
                  }
                );

                const rowsDataArr = dataT?.map((rowData, rowIndex) => {
                  const namesArr = resultSetMetaData?.rowType?.map((item) => {
                    return item?.name;
                  });

                  // Use reduce to build a single object for the row
                  return rowData.reduce((obj, value, index) => {
                    const key = namesArr[index];
                    if (key) {
                      obj[key] = value;
                    }
                    return { id: rowIndex, ...obj };
                  }, {});
                });
                t = copyToClipboard(columnsArr, rowsDataArr);
            //   case "charts":
            //     return c += JSON.stringify(item?.json,null,2);
            }
          });
        });
      } else if (event === "response.text") {
        d += chatData?.text;
      }
    });
    let finalText ="";
    if (agentProgressToggle){
      finalText= [a, b, c, t, d].filter(Boolean).join("\n\n")
    }else{
      finalText= [c, t, d].filter(Boolean).join("\n\n")
    }
    navigator.clipboard
      // .writeText(a + " " + b + " " + c + " " + t + " " + d)
      .writeText(finalText)
      .then(() => alert("copied query"));
    // console.log('line no 169',data);
    //  navigator.clipboard.writeText(JSON.stringify(data)).then(()=>alert('copied query'));
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
    let a = '';
    let columnsArr=[];
    let rowsDataArr=[];
    let c = '';
    let textContent=""
    let tableContent=""
    console.log({filteredArr})
    filteredArr?.forEach((chat, index) => {
      const { event, data: chatData } = chat;
      if (event == "response.thinking") {
      a +=chatData?.text;
      
    }
    else if (event === "response.tool_result") {
      chatData?.content?.forEach((item, index) => {
        Object.keys(item?.json).forEach((type) => {
          const data = item?.json[type];
          console.log("line 187", type);
          switch (type) {
            case "sql":
              return (c += data);
            case "result_set":
              const { data:dataT, resultSetMetaData } = data;
               columnsArr = resultSetMetaData?.rowType?.map(
                (tableData) => {
                  return {
                    field: tableData.name,
                    headerName: tableData.name,
                    width: 150,
                    editable: false,
                  };
                }
              );

               rowsDataArr = dataT?.map((rowData, rowIndex) => {
                const namesArr = resultSetMetaData?.rowType?.map((item) => {
                  return item?.name;
                });
                
                // Use reduce to build a single object for the row
                return rowData.reduce((curr, old, index) => {
                   
                  return curr+"  "+ old;
                },"")
                
              }); 
              console.log({rowsDataArr:rowsDataArr.reduce((curr, old, index) => {
                   
                  return curr+" "+ old;
                },"") })
              tableContent+= resultSetMetaData?.rowType?.map((item) => {
                  return item?.name;
                }).reduce((curr,old)=>{
                  return curr+" "+ old;
                },"")+rowsDataArr.reduce((curr, old, index) => {
                   
                  return curr+"\n"+ old;
                },"") 
            //  t = copyToClipboard(columnsArr, rowsDataArr);
          //   case "charts":
          //     return c += JSON.stringify(item?.json,null,2);
          }
        });
      });
    } else if(event==="response.text"){
      textContent+=chatData.text 
    }
  })
  const sText = agentProgressToggle?a +"\n "+tableContent + "\n"+c + "\n "+textContent :textContent; 
      const blob = new Blob([query || sText], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      // link.download = isSql
      //   ? `query_${timestamp}.txt`
      //   : `summary_${timestamp}.txt`;
      link.download=`agent_${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    //  if (columnsArr && rowsDataArr) {
    //   const workbook = new ExcelJS.Workbook();
    //   const worksheet = workbook.addWorksheet("Sheet1");

    //   worksheet.columns = columnsArr.map((col) => ({
    //     header: col.headerName,
    //     key: col.field,
    //     width: 20,
    //   }));

    //   rowsDataArr.forEach((row) => {
    //     worksheet.addRow(row);
    //   });
    //   workbook.xlsx.writeBuffer().then((buffer) => {
    //     const blob = new Blob([buffer], {
    //       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //     });
    //     saveAs(blob, `query_results_${timestamp}.xlsx`);
    //   });
    // }

  };

  const handleRead = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
       let textToRead = "";
       let a="";
       let b="";
       filteredArr?.forEach((chat, index) => {
        const { event, data: chatData } = chat;
        
        if (event === "response.thinking") {
          a += chatData?.text;
        }
        else if(event === "response.text") {
          b += chatData?.text;
        }
    })
       textToRead = a + b;
     // console.log("line 216", textToRead);

      if (textToRead) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        //Female Voice
        if (availableVoices) {
          utterance.voice = availableVoices[0];
        }

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        speechSynthesis.speak(utterance);
      } else {
        alert("No content available to read.");
      }
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedback) return; // Ensure feedback is selected
    setSqlPrompt(prompt);
    setIsLoading(true); // Start loading
    setError(null); // Reset error state

    try {
      let requestBody;
      // Prepare the request body
      if (isSql) {
        requestBody = {
          user_id: userId,
          query_id: queryId,
          prompt: prompt,
          query: query,
          user_opinion: feedback, // 'like' or 'dislike'
          comment: comment, // Optional comment
        };
      } else if (dataGrid === "data") {
        requestBody = {
          user_id: userId,
          query_id: queryId,
          prompt: sqlprompt,
          query: sqlquery,
          user_opinion: feedback, // 'like' or 'dislike'
          comment: comment, // Optional comment
          type: "data",
          // comment:{
          //   type:"data",
          //   comment:comment
          // }
          //type:"data"
        };
      } else if (summary === "summary") {
        requestBody = {
          user_id: userId,
          query_id: queryId,
          prompt: sqlprompt,
          query: sqlquery,
          user_opinion: feedback, // 'like' or 'dislike'
          comment: comment, // Optional comment
          type: "summary",
        };
      } else if (graph === "graph") {
        requestBody = {
          user_id: userId,
          query_id: queryId,
          prompt: sqlprompt,
          query: sqlquery,
          user_opinion: feedback, // 'like' or 'dislike'
          comment: comment, // Optional comment
          type: "graph",
        };
      }

      const token = fetchToken();

      // Make the API call
      const response = await fetch(`${API_BASE_URL}/submitFeedback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      // Parse the response (if needed)
      const data = await response.json();

      // Mark feedback as submitted
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  useEffect(()=>{
    console.log({agentProgressToggle})
  },[agentProgressToggle])

  return (
    <div style={{}}>
      {/* Feedback Section */}
      {!isSubmitted ? (
        <div style={{ display: "grid", flexDirection: "column" }}>
          {/* <p style={{fontFamily:'"OpenSans",sans-serif',fontSize: '1.1 rem', fontWeight: 400}}>Was this response helpful?</p> */}
          {/* <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}> */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 2,
            }}
          >
            <Stack direction="row" spacing={2}>
              {/* <img src={copy} alt="gcp" style={{width:25, }} /> */}
              {/* <Button > */}
              {graph !== "graph" && (
                <IconButton
                  sx={{
                    fontSize: "16px",
                    color: textColor,
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "20px",
                    gap: 2,
                  }}
                  onClick={handleCopy}
                  disabled={loading && !abortcontrollerRef?.signal.aborted }
                  // disabled={disableCopy}
                >
                  <Box
                    component="img"
                    src={copysrc}
                    alt="logo"
                    sx={{
                      pointerEvents: (loading && !abortcontrollerRef?.signal.aborted)? "none" : "auto",
                      opacity: (loading && !abortcontrollerRef?.signal.aborted) ? 0.5 : 1,
                    }}
                  />
                  Copy
                  {/* </Typography> */}
                </IconButton>
              )}
              {/* </Button> */}
              {/* <img src={download} alt="gcp" style={{width:22, }} /> */}
              {graph !== "graph" &&
                !chatError &&
                content !== "Query produced no results" && (
                  <IconButton
                    sx={{
                      fontSize: "16px",
                      color: textColor,
                      fontStyle: "normal",
                      fontWeight: 500,
                      lineHeight: "20px",
                      gap: 2,
                    }}
                    onClick={handleDownload}
                    disabled={loading && !abortcontrollerRef?.signal.aborted}
                  >
                    <Box
                      component="img"
                      src={downloadsrc}
                      alt="logo"
                      sx={{
                        pointerEvents: (loading && !abortcontrollerRef?.signal.aborted) ? "none" : "auto",
                        opacity: (loading && !abortcontrollerRef?.signal.aborted) ? 0.5 : 1,
                      }}
                    />
                    Download
                  </IconButton>
                )}
              {/* <img src={read} alt="gcp" style={{width:22, }} /> */}
              {/* {data.map(item=>( */}
              {/* {graph !== "graph" && ( */}

              <IconButton
                sx={{
                  fontSize: "16px",
                  color: textColor,
                  fontStyle: "normal",
                  fontWeight: 500,
                  lineHeight: "20px",
                  gap: 2,
                }}
                onClick={() => handleRead()}
                disabled={loading && !abortcontrollerRef?.signal.aborted}
              >
                <Box
                  component="img"
                  src={readsrc}
                  alt="logo"
                  sx={{
                    pointerEvents: (loading && !abortcontrollerRef?.signal.aborted) ? "none" : "auto",
                    opacity: (loading && !abortcontrollerRef?.signal.aborted) ? 0.5 : 1,
                  }}
                />

                {isSpeaking ? "Stop" : "Read"}
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={2}>
              <IconButton
                onClick={() => handleFeedbackClick("like")}
                disabled={loading && !abortcontrollerRef?.signal.aborted}
                style={{
                  //padding: '8px 16px',
                  //backgroundColor: feedback === 'like' ? '#4CAF50' : '#f1f1f1',
                  //color: feedback === 'like' ? '#fff' : '#000',
                  // border: 'none',
                  // borderRadius: '4px',
                  cursor: "pointer",
                  fontFamily: '"OpenSans",sans-serif',
                  // fontSize: '1.1 rem',
                  // fontWeight: 400,
                }}
              >
                {/* <img src={Thumbsup} alt="gcp" style={{width:20, }} /> */}
                <Box
                  component="img"
                  src={thumbsupsrc}
                  alt="logo"
                  sx={{
                    pointerEvents: (loading && !abortcontrollerRef?.signal.aborted) ? "none" : "auto",
                    opacity: (loading && !abortcontrollerRef?.signal.aborted) ? 0.5 : 1,
                  }}
                />
              </IconButton>
              <IconButton
                onClick={() => handleFeedbackClick("dislike")}
                disabled={loading && !abortcontrollerRef?.signal.aborted}
                style={{
                  // padding: '8px 16px',
                  // backgroundColor: feedback === 'dislike' ? '#f44336' : '#f1f1f1',
                  // color: feedback === 'dislike' ? '#fff' : '#000',
                  // border: 'none',
                  // borderRadius: '4px',
                  cursor: "pointer",
                  fontFamily: '"OpenSans",sans-serif',
                  // fontSize: '1.1 rem',
                  // fontWeight: 400,
                }}
              >
                {/* <img src={Thumbsdown} alt="gcp" style={{width:20, }} /> */}
                <Box
                  component="img"
                  src={thumbsdownsrc}
                  alt="logo"
                  sx={{
                    pointerEvents: (loading && !abortcontrollerRef?.signal.aborted) ? "none" : "auto",
                    opacity: (loading && !abortcontrollerRef?.signal.aborted) ? 0.5 : 1,
                  }}
                />
              </IconButton>
            </Stack>
          </Box>
          {/* </div> */}

          {/* Optional Comment */}
          {feedback && (
            <div style={{ width: "100%", marginBottom: "10px" }}>
              <textarea
                placeholder="Please provide additional feedback (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          {feedback && (
            <button
              onClick={handleSubmitFeedback}
              disabled={isLoading} // Disable button while loading
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                fontFamily: "Elevance Sans",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "Submitting..." : "Submit Feedback"}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <p
              style={{
                color: "#f44336",
                textAlign: "right",
                fontFamily: '"OpenSans",sans-serif',
                fontSize: "1.1 rem",
                fontWeight: 400,
              }}
            >
              {error}
            </p>
          )}
        </div>
      ) : (
        <p
          style={{
            color: "#4CAF50",
            textAlign: "right",
            fontFamily: '"OpenSans",sans-serif',
            fontSize: "1.1 rem",
            fontWeight: 400,
          }}
        >
          Thank you for your feedback!
        </p>
      )}
    </div>
  );
};

export default AgentChatBotFeedback;
