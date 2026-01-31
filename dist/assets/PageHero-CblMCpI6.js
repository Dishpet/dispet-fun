import{s as r,j as e}from"./index-DoqAkuYi.js";import{c}from"./clouds-top-B3AemNNE.js";const x=({title:s,characterImage:t,children:l,imageClassName:i,isProductPage:a=!1})=>{const o=r(),n=["/shop","/cart","/checkout"].includes(o.pathname);return e.jsxs("section",{className:`relative min-h-[calc(100vh-100px)] flex items-center justify-center overflow-hidden pt-0 -mt-32 ${n?"bg-gradient-to-br from-[#00ffbf] to-[#0089cd]":"bg-gradient-to-br from-[#ad00e9] to-[#0044bf]"}`,children:[e.jsx("img",{src:c,alt:"",className:"absolute bottom-0 left-0 min-w-[101%] w-[101%] -ml-[1px] -mb-[2px] h-auto z-0"}),e.jsx("div",{className:"container relative z-10 px-4 py-20",children:e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-12 items-center max-w-7xl mx-auto",children:[e.jsx("div",{className:`${a?"lg:col-span-1":"lg:col-span-2"} text-white space-y-8 text-center lg:text-left mt-32 lg:mt-0 animate-fade-in`,children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("h1",{className:"text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight drop-shadow-lg",children:s}),l]})}),t&&e.jsx("div",{className:`relative flex justify-center lg:justify-end animate-fade-in ${a?"lg:col-span-2":""}`,style:{animationDelay:"0.2s"},children:e.jsx("img",{src:t,alt:"Page Hero Character",className:`w-full h-auto object-contain mt-[100px] ${i||"max-w-md"}`})})]})}),e.jsx("style",{children:`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `})]})};export{x as P};
