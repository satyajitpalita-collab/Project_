import React, { useEffect,useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Avatar, Box, Typography, Paper,Button,useTheme } from '@mui/material';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github.css';
import { IconButton } from '@mui/material'; 
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import bot from '../../../../src/assets/ChatPageIcon/bot.png'; 
import data from '../../../../src/assets/ChatPageIcon/data.png'; 
import ChartModal from '../../ChartModal';
import { useAppUrl } from '../../../helpers/hooks/hooks';
import ChatBotFeedback from '../../ChatBotFeedback';
import ChatMessageMapper from './ChatMessageMapper';
import { useCustomThemeVars } from '../../../helpers/hooks/useCustomThemeVars';
import { titleSql } from '../../../const/constant';
import { ChatLoadingModalComponent } from './ChatLoadingModalComponent';
import AgentChatBotFeedback from './AgentChatBotFeedback';


//hljs.registerLanguage('sql', sql);

const AgentChatMessage = forwardRef (({ chatLog, chatbotImage, userImage, 
  showResponse, storedResponse,executeSQLHandleButtonClick,
 contentTableRef,contentSumm,summType,dataType,isLoading
  
}, ref) => {
   const {APP_NAME} =useAppUrl();
   const [isOpen, setIsOpen] = useState(APP_NAME==='intelliq' ? true : false);
  const {  bgColor,    bgColorAssist,    textColor,    boxShadow } =useCustomThemeVars()
    useImperativeHandle(ref, ()=> ({
      closeSQLBox: () => setIsOpen(false)
    }));
    const contentRef=useRef();
  

  // useEffect(() => {
  //   hljs.highlightAll();   
  // }, [chatLog, showResponse]);

  // const codeRef = useRef([]); 
  
  // const copyToClipboard = async () => {
  //   debugger;
    
  //   const codeElement = codeRef.current;
  //   if (codeElement) {
  //     try {
  //       await navigator.clipboard.writeText(codeElement.textContent);
  //       console.log(codeElement.textContent)
  //       //alert('SQL code copied to clipboard!');
  //     } catch (err) {
  //       console.error('Failed to copy: ', err);
  //     }
  //   }
  // };
  
  
  
    function toggle() {
      setIsOpen((isOpen) => !isOpen);
    } 

  const copyToClipboard=(text)=>{
    
    //const text=codeRef.current.textContent;
    navigator.clipboard.writeText(text);
      //console.log('from chat bubble',text);
  
  }

 
//console.log(typeof chatLog[0].type);
  
  return (  
    <Box sx={{ width: '100%'}}>
      {chatLog?.map((chat, index) => 
       {   
        return(
        <Box key={index} sx={{ display: 'flex', justifyContent: chat?.role === 'assistant' ? 'flex-start' : 'flex-end', marginBottom: '25px', marginTop: '25px'}}>
           <Box sx={{ 
             display: 'flex',
             flexDirection: chat.role==='assistant' ? "row" : "row-reverse !important",
             alignItems:"flex-start",
             justifyContent: chat.role==='assistant'?"flex-start":"flex-end",
            }}>
          {(chat.role === 'assistant' ) ? (
                <Avatar src={bot} alt="Chatbot" sx={{ mr: 2, width: 40, height: 32,}} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" style={{marginLeft:"10px"}} viewBox="0 0 40 40" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M20.0007 3.33301C10.7957 3.33301 3.33398 10.7947 3.33398 19.9997C3.33398 29.2047 10.7957 36.6663 20.0007 36.6663C29.2057 36.6663 36.6673 29.2047 36.6673 19.9997C36.6673 10.7947 29.2057 3.33301 20.0007 3.33301ZM14.1673 15.833C14.1673 15.067 14.3182 14.3084 14.6114 13.6007C14.9045 12.893 15.3342 12.2499 15.8759 11.7082C16.4175 11.1665 17.0606 10.7369 17.7683 10.4437C18.4761 10.1506 19.2346 9.99967 20.0007 9.99967C20.7667 9.99967 21.5252 10.1506 22.233 10.4437C22.9407 10.7369 23.5838 11.1665 24.1254 11.7082C24.6671 12.2499 25.0968 12.893 25.3899 13.6007C25.6831 14.3084 25.834 15.067 25.834 15.833C25.834 17.3801 25.2194 18.8638 24.1254 19.9578C23.0315 21.0518 21.5477 21.6663 20.0007 21.6663C18.4536 21.6663 16.9698 21.0518 15.8759 19.9578C14.7819 18.8638 14.1673 17.3801 14.1673 15.833ZM30.4306 28.3063C29.1826 29.8753 27.5965 31.1421 25.7905 32.0125C23.9846 32.8829 22.0054 33.3343 20.0007 33.333C17.9959 33.3343 16.0167 32.8829 14.2108 32.0125C12.4048 31.1421 10.8187 29.8753 9.57065 28.3063C12.2723 26.368 15.959 24.9997 20.0007 24.9997C24.0423 24.9997 27.729 26.368 30.4306 28.3063Z" fill="#2861BB"/>
              </svg>
              )}
              {/* {chat.role === 'user'? */}
              {/* ( */}
                <Paper elevation={2} sx={{ backgroundColor: chat.role === 'assistant' ? bgColorAssist : bgColor, padding: '12px', borderRadius: '15px', maxWidth: chat.role === 'assistant' ?'1150px':'800px', textWrap:'wrap', boxShadow: boxShadow, color: textColor, paddingRight: chat.role === 'assistant' ? '60px' : '30px', paddingTop: chat.role === 'assistant' ? '30px' : '10px' ,minWidth: chat.role === 'assistant' ?'1150px':'800px'}}>
                 <ChatComponent chat={chat} index={index} isLastIndex={index===chatLog.length-1?true:false} contentRef={contentRef} executeSQLHandleButtonClick={executeSQLHandleButtonClick} isLoading={isLoading} /> 
             </Paper>
              
             {/* ):(
              <Box sx={{ backgroundColor:  bgColorAssist, padding: '12px', borderRadius: '15px', minWidth:'60%', width:'60%', textWrap:'wrap',  color: textColor, paddingRight: '30px', paddingTop: '10px' }}>
               <ChatComponent chat={chat} index={index}  contentRef={contentRef} executeSQLHandleButtonClick={executeSQLHandleButtonClick} isLoading={isLoading}/>
              </Box>
              )} */}
              </Box>
          
        </Box>
      )})}
         {(chatLog.length>0&&chatLog[chatLog.length-1]?.role !== 'assistant')&&<ChatLoadingModalComponent/> }
    </Box>

  );
});

function ChatComponent({chat,index,isLoading , isLastIndex,executeSQLHandleButtonClick,contentRef}){  
  const [progState, SetProgState] = useState(false)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>               
                  <Box  variant="body2" sx={{ fontFamily:'"OpenSans",sans-serif',fontSize: '1.1 rem', fontWeight: 400, ml: 1, width: "100%" }}>
                    {
                    (chat?.type !== "error" ) ? (
                      <>
                      {(chat.isSQLResponse) ? 
                     (<ChatMessageMapper  
                        data={chat.data} 
                        event={chat?.event}
                        isLastIndex={isLastIndex}
                        contentRef={contentRef}
                          executeSQLHandleButtonClick={executeSQLHandleButtonClick} 
                          rawResponse={chat.rawResponse}  
                          isLoading={isLoading}
                          index={index}
                          onProgChange={SetProgState}
                          /> )
                          :(
                        <pre key={index} style={{ display: 'flex',justifyContent:'flex-start', whiteSpace: 'pre-wrap', fontFamily:'"OpenSans",sans-serif',fontSize: '1.1rem', fontWeight: 400}}>
                      {chat?.graph==='graph' ?(
                        <ChartModal chartData={chat.content || []} id={index}/>
                      ):(<>{chat.content}</>)}
                      
                    
                    </pre>
                      )}
                      </>
                    
                    ) 
                    : (
                    <p key={index} style={{ fontFamily:'"OpenSans",sans-serif',fontSize: '1.1rem', fontWeight: 400,textAlign: 'justify', color:'black'}}>
                    {chat.content}
                    </p>)
                    }
                    {chat.role === 'assistant'  && (
                      // <Box>
                      //   <Box  sx={{display:"flex",justifyContent:"flex-start",marginTop:"20px"}} >
                      //   <img src={copy} alt="gcp" style={{width:20, }} />
                      //   <img src={download} alt="gcp" style={{width:20, }} />
                      //   <img src={read} alt="gcp" style={{width:20, }} />
                      //   </Box>
                        <  > 
                        {/* {!isLoading && ( */}
                        <AgentChatBotFeedback 
                          response="response"
                          userId="user123"
                          queryId="chat.queryId"
                          loading={isLoading}
                          data={chat.data} 
                          progState={progState}
                        />
                        {/* )} */}
                          </>
                          
                      // </Box>
                      // <div style={{ maxWidth: '600px', marginLeft: 'auto', padding: '20px' }}>
                      
                      // </div>
                    ) 
                  }
                  </Box>
                  
   </Box>
  )
}

export default React.memo(AgentChatMessage);
