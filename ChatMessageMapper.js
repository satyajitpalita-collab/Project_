import { Button, Switch, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useAppUrl } from "../../../helpers/hooks/hooks";
import { useCustomThemeVars } from "../../../helpers/hooks/useCustomThemeVars";
import AgentStatusComponent from "./AgentStatusComponent";
import AgentThinkingComponent from "./AgentThinkingComponent";
import AgentToolResultComponent from "./AgentToolResultComponent";
import AgentThinkingDeltaComponent from "./AgentThinkingDeltaComponent";
import { combineConsecutiveEvents } from "../helper/helpers";
import AgentToolUseComponent from "./AgentToolUseComponent";
import AgentTextComponent from "./AgentTextComponent"; 
import AgentChartComponent from "./AgentChartComponent"; 
import { PulseLoader } from "react-spinners";
import { ContactsOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { spec } from "../../../const/constant";
import AgentChartModal from "./AgentChartModal";
import { useAtom } from "jotai";
import { abortcontrollerRefAtom, agentProgressToggleAtom, progRef } from "../../../helpers";
import './ChatMessagemapper.css';
import AgentTableAccordianComponent from "./AgentTableAccordianComponent";


const ChatMessageMapper = (chatProps) => {
  const { data, event, contentRef, index , isLastIndex ,isLoading, onProgChange} = chatProps;
  const { APP_NAME } = useAppUrl();
  const { bgColor, bgColorAssist, textColor, boxShadow } = useCustomThemeVars();
  const [abortcontrollerRef,setAbortcontrollerRef]=useAtom(abortcontrollerRefAtom);
  const [prog, setProg] = useState(false)
  const [statusSet, setStatusSet] = useState([])
  const [agentProgressToggle,setAgentProgressToggle]=useAtom(agentProgressToggleAtom)
  const responseMapper = {
    "response.status": "Thinking...",
    "response.thinking.delta": "Thinking...",
    "response.thinking": 'Thinking...',
    "response.tool_result.status": "Tool Result...",
    "response.tool_use": 'Tool Use...',
    "response.tool_result": 'Tool Result...',
    // "response.chart": 'Final Steps...',
  }
  // if(!data){
  //   return <></>
  // }

 const combinedChats = combineConsecutiveEvents(data);

// Step 2: Create a filtered array based on rendering priority.
const chatsToRender = combinedChats.filter(chat => {
  // Check if a higher-priority 'response.thinking' event exists.
  const hasThinkingEvent = combinedChats.some(c => c.event === 'response.thinking');
  const hasTextEvent = combinedChats.some(c => c.event === 'response.thinking'); 
  // If a 'response.thinking' event exists, filter out the 'response.thinking.delta' event.
  if (hasThinkingEvent && chat.event === 'response.thinking.delta') {
    return false; // Exclude the lower-priority delta event.
  }
  if (hasTextEvent && chat.event === 'response.text.delta') {
    return false; // Exclude the lower-priority delta event.
  }
  
  // Otherwise, include all other events.
  return true;
});

const filteredArr = chatsToRender.filter((item,index)=> !["response.status" ,"response.tool_result.status"].includes(item.event) || (index===chatsToRender.length-1))

filteredArr?.map((chat)=>{
  const {event}=chat 
  if(event==="response.tool_result.status"||event==="response.status"){
    progRef.current?.push(chat?.data?.message)
  }else{
    progRef.current?.push(responseMapper[event])
  }
})
const handleSwitch=()=>{
  setAgentProgressToggle(!prog)
  setProg((prev) => !prev)
}
useEffect(() => {
  if(statusSet.length < progRef.current?.length){
    //console.log("Prog ref --> ", progRef.current, " status set -> ", statusSet)
    setStatusSet(progRef.current)
  }
}, [progRef]);
 
   
  return (
    <Box ref={contentRef} key={index}>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
        <Typography className="blink" style={{visibility: !prog ? "visible" : "hidden"}} variant="subtitle2" display={"flex"} alignItems={"center"} 
        gap={"6"} color='oklch(27.8% 0.033 256.848)' fontFamily={"sans-serif"} fontSize={"16px"}>
          {statusSet.at(-1)}
          </Typography>
          {[
          "response.status",
          "response.tool_result.status",
          "response.tool_use",
          "response.thinking.delta",
        ].includes(filteredArr[filteredArr?.length - 1]?.event)
          ? ""
          : isLoading &&
            isLastIndex && !abortcontrollerRef?.signal.aborted &&
             <PulseLoader color="#1a3673" size={6} />}
            </div>
            <Box sx={{display:"flex",alignItems:"center"}}>
      <Switch
      key={index}
        checked={prog}
        onChange={handleSwitch }
        slotProps={{ input: { "aria-label": "controlled" } }}
      />
      <Typography sx={{fontWeight:600}}>
      View Progress
      </Typography>
      </Box>
      </Box>
      {/* <h4 style={{display: !prog ? "block" : 'none'}}>{statusSet.at(-1)}</h4> */}
      
      <Box
        sx={{
          width: "100%",
          color: textColor,
          // display:"flex",
          // flexWrap:"wrap",
          // maxWidth:"1000px",
          // width:"100%",
          //wordSpacing:"10px",
          fontSize: "16px",
          fontStyle: "normal",
          fontWeight: 500,
          lineHeight: "20px",
          paddingBottom: "18px",
         
        }}
      > 
        
        {filteredArr &&
          filteredArr?.map((chat,index) => {
            const { event, data: chatData } = chat;

            const shouldShow = prog || !["response.status", "response.tool_result.status",
                                           "response.thinking", "response.thinking.delta",
                                            "response.tool_use", "response.tool_result"].includes(event);
            if (!shouldShow) return null;                                
            switch (event) {
              case "response.status":
                return (
                  <div style={{ display: !prog ? "none" : "block"}}> 
                <AgentStatusComponent data={chatData}  key={index}/>
                </div>
                )
              case "response.thinking.delta":
              // return <AgentThinkingDeltaComponent data={chatData}/>;
              case "response.thinking":
                return (
                  <div style={{ display: !prog ? "none" : "block"}}> 
                  <AgentThinkingComponent data={chatData} event={event}  key={index}/>
                  </div>)
              case "response.tool_result.status":
                return (
                  <div style={{ display: !prog ? "none" : "block"}}> 
                  <AgentStatusComponent data={chatData}  key={index}/>
                  </div>)
              case "response.tool_use":
                return (
                <div style={{ display: !prog ? "none" : "block"}}> 
                <AgentToolUseComponent data={chatData}  key={index}/>
                </div>)
              case "response.tool_result":
                return (
                  <div style={{ display: !prog ? "none" : "block"}}> 
                   <AgentToolResultComponent data={chatData}  key={index}/>
                   </div>)
              case "response.chart":
                return (
                  // <div style={{ display: !prog ? "none" : "block"}}> 
                   <AgentChartComponent data={chatData?.chart_spec}  key={index}/>
                  //  </div>)
                )
              case "response.table":
                return (
                  // <div style={{ display: !prog ? "none" : "block"}}> 
                   <AgentTableAccordianComponent data={chatData}  key={index}/>
                  //  </div>)
                )
              case "response.text.delta":
              case "response.text":
                return <AgentTextComponent data={chatData}  key={index}/>;
               
            }
          })}
        
      </Box>
      {/* <Box sx={{ borderRadius: "10px 10px 0px 0px", overflow: 'hidden', boxShadow: 1 }}>
                    <Box sx={{ display: 'flex',height:"55px", justifyContent: 'space-between', alignItems: 'center', bgcolor: '#666', px: 2, py: 1 }}>
                       
                    <Typography color="white" fontSize={14} fontWeight={500}>SQL</Typography>
                      <Box >
                      <IconButton size="small" sx={{ color: 'white',mr:2 }}>
                      <VisibilityIcon fontSize="small" onClick={()=>toggle()}/>
                      </IconButton>
                      <IconButton size="small" sx={{ color: 'white' }} onClick={()=>copyToClipboard(chat.query)}>
                      <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      </Box>
                    </Box>
                    {isOpen &&
                  
                    <SyntaxHighlighter
                    style={dracula}
                    wrapLongLines={true}
                    wrapLines={true}
                    customStyle={{
                      margin:0,
                      paddingTop:"20px",
                      borderRadius: "0px 0px 10px 10px",
                      fontFamily:'"OpenSans",sans-serif',
                    }}
                    lineProps={{
                      style: {
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        display: 'block',
                        fontFamily:'"OpenSans",sans-serif',
                        
                      }
          }}
                    PreTag="div"
                    language="sql"
                    // {...props}
                    // wrapLongLines={true}
                  >
                    {String(chat.query).replace(/\n$/, "")}
                  </SyntaxHighlighter>
}
                    </Box> */}
      {/* {(APP_NAME === "intelliq"  ) && (
        <Typography
          sx={{
            color: textColor,
            fontSize: "16px",
            fontStyle: "normal",
            fontWeight: 500,
            lineHeight: "20px",
            paddingTop: "18px",
          }}
        >
          Other View Options:
        </Typography>
      )}
      {APP_NAME === "intelliq" && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "left",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <Button
            disabled={isLoading}
            sx={{
              textTransform: "none",
              backgroundColor: "#2861BB",
              color: "#FFF",
            }}
            variant="contained"
            startIcon={
              <img src={data} alt="data" style={{ width: 24, height: 24 }} />
            }
            onClick={() => executeSQLHandleButtonClick(rawResponse)}
          >
            View Data
          </Button>
        </Box>
      )} */}
    </Box>
  );
};

export default React.memo(ChatMessageMapper);

 
