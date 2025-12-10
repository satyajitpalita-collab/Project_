import { VegaEmbed } from "react-vega"
import { parseJson } from "../helper/helpers"
import AgentAccordianComponent from "./AgentAccordianComponent"
import AgentChartModal from "./AgentChartModal" 
import React from 'react'; // Import React

 function AgentChartComponent(agentChartComponentProps){ 
   if(!agentChartComponentProps?.data){
      return;
   }
    const spec=JSON.parse(agentChartComponentProps?.data) 
    const updtd_spec = {...spec, width: 700, height: 350}
 console.log({spec})
    return (
          <AgentAccordianComponent title={"Charts"} isDefaultopen={true}>
            {
               (spec)&&(
                   <VegaEmbed spec={updtd_spec}  />
               )
            }
            {/* <AgentChartModal chartType={spec?.mark} spec={spec} chartData={spec?.data?.values} title={spec?.title}/> */}
        </AgentAccordianComponent>
    ) 

}

// Corrected export statement:
export default React.memo(AgentChartComponent);
