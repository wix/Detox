"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[7766],{3905:(e,t,a)=>{a.d(t,{Zo:()=>d,kt:()=>m});var n=a(7294);function i(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function o(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function r(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?o(Object(a),!0).forEach((function(t){i(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):o(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function l(e,t){if(null==e)return{};var a,n,i=function(e,t){if(null==e)return{};var a,n,i={},o=Object.keys(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||(i[a]=e[a]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(i[a]=e[a])}return i}var s=n.createContext({}),p=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):r(r({},t),e)),a},d=function(e){var t=p(e.components);return n.createElement(s.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var a=e.components,i=e.mdxType,o=e.originalType,s=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),u=p(a),m=i,h=u["".concat(s,".").concat(m)]||u[m]||c[m]||o;return a?n.createElement(h,r(r({ref:t},d),{},{components:a})):n.createElement(h,r({ref:t},d))}));function m(e,t){var a=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=a.length,r=new Array(o);r[0]=u;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:i,r[1]=l;for(var p=2;p<o;p++)r[p]=a[p];return n.createElement.apply(null,r)}return n.createElement.apply(null,a)}u.displayName="MDXCreateElement"},2479:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>s,contentTitle:()=>r,default:()=>c,frontMatter:()=>o,metadata:()=>l,toc:()=>p});var n=a(7462),i=(a(7294),a(3905));const o={id:"detox-object-api",slug:"api/detox-object-api",title:"Detox Object API",sidebar_label:"The `detox` Object"},r=void 0,l={unversionedId:"detox-object-api",id:"version-19.x/detox-object-api",title:"Detox Object API",description:"The detox Object",source:"@site/versioned_docs/version-19.x/APIRef.DetoxObjectAPI.md",sourceDirName:".",slug:"/api/detox-object-api",permalink:"/Detox/docs/19.x/api/detox-object-api",draft:!1,editUrl:"https://github.com/wix/Detox/edit/master/docs/versioned_docs/version-19.x/APIRef.DetoxObjectAPI.md",tags:[],version:"19.x",frontMatter:{id:"detox-object-api",slug:"api/detox-object-api",title:"Detox Object API",sidebar_label:"The `detox` Object"},sidebar:"tutorialSidebar",previous:{title:"Configuration Options",permalink:"/Detox/docs/19.x/config/overview"},next:{title:"The `device` Object",permalink:"/Detox/docs/19.x/api/device-object-api"}},s={},p=[{value:"The <code>detox</code> Object",id:"the-detox-object",level:2},{value:"Methods",id:"methods",level:3},{value:"<code>detox.init()</code>",id:"detoxinit",level:4},{value:"Explicit imports during initialization",id:"explicit-imports-during-initialization",level:5},{value:"Reusing existing app",id:"reusing-existing-app",level:5},{value:"<code>detox.beforeEach()</code>",id:"detoxbeforeeach",level:4},{value:"<code>detox.afterEach()</code>",id:"detoxaftereach",level:4},{value:"<code>detox.cleanup()</code>",id:"detoxcleanup",level:4},{value:"<code>detox.traceCall()</code>",id:"detoxtracecall",level:4},{value:"<code>detox.trace.startSection(), detox.trace.endSection()</code>",id:"detoxtracestartsection-detoxtraceendsection",level:4}],d={toc:p};function c(e){let{components:t,...o}=e;return(0,i.kt)("wrapper",(0,n.Z)({},d,o,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h2",{id:"the-detox-object"},"The ",(0,i.kt)("inlineCode",{parentName:"h2"},"detox")," Object"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"detox")," is globally available in every test file, though currently it is only used in the setup/init file."),(0,i.kt)("blockquote",null,(0,i.kt)("p",{parentName:"blockquote"},"NOTE: detox is test runner independent, and we encourage you to choose your own test runner, but for the sake of demonstration we will use ",(0,i.kt)("inlineCode",{parentName:"p"},"mocha"),"\u2019s syntax.")),(0,i.kt)("h3",{id:"methods"},"Methods"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"#detoxinit"},(0,i.kt)("inlineCode",{parentName:"a"},"detox.init()"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"#detoxbeforeeach"},(0,i.kt)("inlineCode",{parentName:"a"},"detox.beforeEach()"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"#detoxaftereach"},(0,i.kt)("inlineCode",{parentName:"a"},"detox.afterEach()"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"#detoxcleanup"},(0,i.kt)("inlineCode",{parentName:"a"},"detox.cleanup()"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"#detoxtracecall"},(0,i.kt)("inlineCode",{parentName:"a"},"detox.traceCall()"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"#detoxtracestartsection-detoxtraceendsection"},(0,i.kt)("inlineCode",{parentName:"a"},"detox.trace.startSection(), detox.trace.endSection()")))),(0,i.kt)("h4",{id:"detoxinit"},(0,i.kt)("inlineCode",{parentName:"h4"},"detox.init()")),(0,i.kt)("p",null,"The setup phase happens inside ",(0,i.kt)("inlineCode",{parentName:"p"},"detox.init()"),". This is the phase where detox reads its configuration, starts a server, loads its expectation library and starts a simulator."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},"If you\u2019re using ",(0,i.kt)("em",{parentName:"strong"},"mocha")),", in your ",(0,i.kt)("inlineCode",{parentName:"p"},"init.js")," add:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"const detox = require('detox');\n\nbefore(async () => {\n  await detox.init();\n});\n")),(0,i.kt)("h5",{id:"explicit-imports-during-initialization"},"Explicit imports during initialization"),(0,i.kt)("p",null,"Detox exports ",(0,i.kt)("inlineCode",{parentName:"p"},"device"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"expect"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"element"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"by")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"waitFor")," as globals by default, if you want to control their initialization manually, set init detox with ",(0,i.kt)("inlineCode",{parentName:"p"},"initGlobals")," set to ",(0,i.kt)("inlineCode",{parentName:"p"},"false"),". This is useful when during E2E tests you also need to run regular expectations in node. jest ",(0,i.kt)("inlineCode",{parentName:"p"},"Expect")," for instance, will not be overridden by Detox when this option is used."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"const detox = require('detox');\n\nbefore(async () => {\n  await detox.init(undefined, {initGlobals: false});\n});\n")),(0,i.kt)("p",null,"Then import them manually:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"const {device, expect, element, by, waitFor} = require('detox');\n")),(0,i.kt)("p",null,"Use ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/wix/Detox/tree/master/examples/demo-react-native/e2eExplicitRequire"},"this example")," for initial setup"),(0,i.kt)("h5",{id:"reusing-existing-app"},"Reusing existing app"),(0,i.kt)("p",null,"By default ",(0,i.kt)("inlineCode",{parentName:"p"},"await detox.init();")," will uninstall and install the app. If you wish to reuse the existing app for a faster run, add ",(0,i.kt)("inlineCode",{parentName:"p"},"{reuse: true}")," param to your init."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"before(async () => {\n  await detox.init(undefined, {reuse: true});\n});\n")),(0,i.kt)("h4",{id:"detoxbeforeeach"},(0,i.kt)("inlineCode",{parentName:"h4"},"detox.beforeEach()")),(0,i.kt)("p",null,"This method should be called at the start of every test to let Detox\u2019s artifacts lifecycle know it is the time to start recording logs and videos, or to take another ",(0,i.kt)("inlineCode",{parentName:"p"},"beforeEach.png")," screenshot. Although this is one of usage of ",(0,i.kt)("inlineCode",{parentName:"p"},"beforeEach"),", Detox does not limit itself to this usage and may utilize calls to ",(0,i.kt)("inlineCode",{parentName:"p"},"beforeEach")," for additional purposes in the future."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-typescript"},"declare function beforeEach(testSummary: {\n  title: string;\n  fullName: string;\n  status: 'running';\n})\n")),(0,i.kt)("p",null,"Usually, you are not supposed to write own implementation of this call, instead rely on Detox in-house adapters for ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/wix/Detox/tree/master/examples/demo-react-native/e2e/init.js"},"mocha")," and ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/wix/Detox/tree/master/examples/demo-react-native-jest/e2e/init.js"},"jest")," as in the examples. It should alleviate transitions to newer Detox versions for you as the chances are that API specification won\u2019t prove itself as sufficient and it may undergo rewrites and extensions."),(0,i.kt)("blockquote",null,(0,i.kt)("p",{parentName:"blockquote"},"NOTE: If you are implementing support for a test runner different from Mocha and Jest, please keep in mind that ",(0,i.kt)("em",{parentName:"p"},"pending")," (also known as ",(0,i.kt)("em",{parentName:"p"},"skipped"),") tests should not trigger ",(0,i.kt)("inlineCode",{parentName:"p"},"detox.beforeEach()")," at all, neither ",(0,i.kt)("inlineCode",{parentName:"p"},"detox.afterEach()"),". The rule of thumb is either you guarantee you call them both, or you don\u2019t call anyone.")),(0,i.kt)("h4",{id:"detoxaftereach"},(0,i.kt)("inlineCode",{parentName:"h4"},"detox.afterEach()")),(0,i.kt)("p",null,"You are expected to call this method only after the test and all its inner ",(0,i.kt)("inlineCode",{parentName:"p"},"afterEach()"),"-es complete. Besides passing test title and full name, you should pay heed on delivering a valid status field: ",(0,i.kt)("em",{parentName:"p"},"failed")," or ",(0,i.kt)("em",{parentName:"p"},"passed"),". If the test has another status (e.g. ",(0,i.kt)("em",{parentName:"p"},"skipped"),"), please comply to the note above in ",(0,i.kt)("a",{parentName:"p",href:"#detoxbeforeEach"},"detox.beforeEach()")," or use one of these two values as a fallback."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-typescript"},"declare function afterEach(testSummary: {\n  title: string;\n  fullName: string;\n  status: 'failed' | 'passed';\n})\n")),(0,i.kt)("p",null,"Normally, you are not supposed to write own implementation of this call, as mentioned earlier in the ",(0,i.kt)("a",{parentName:"p",href:"#detoxbeforeeach"},"detox.beforeEach()")," documentation."),(0,i.kt)("h4",{id:"detoxcleanup"},(0,i.kt)("inlineCode",{parentName:"h4"},"detox.cleanup()")),(0,i.kt)("p",null,"The cleanup phase should happen after all the tests have finished. This is the phase where detox server shuts down. The simulator will also shut itself down if ",(0,i.kt)("inlineCode",{parentName:"p"},"--cleanup")," flag is added to ",(0,i.kt)("inlineCode",{parentName:"p"},"detox test")),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},"If you\u2019re using ",(0,i.kt)("em",{parentName:"strong"},"mocha")),", in your ",(0,i.kt)("inlineCode",{parentName:"p"},"init.js")," add:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"after(async () => {\n  await detox.cleanup();\n});\n")),(0,i.kt)("h4",{id:"detoxtracecall"},(0,i.kt)("inlineCode",{parentName:"h4"},"detox.traceCall()")),(0,i.kt)("p",null,"\u26a0\ufe0f ",(0,i.kt)("strong",{parentName:"p"},"Beta")),(0,i.kt)("p",null,"Trace a subprocess of your test\u2019s runtime such that it would leave traces inside the ",(0,i.kt)("a",{parentName:"p",href:"/Detox/docs/19.x/api/artifacts#timeline-plugin"},"Timeline artifact"),", for a later inspection."),(0,i.kt)("p",null,"Example:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"it('Verify sanity things', async () => {\n  // Instead of this typical direct call:\n  // await element(by.id('sanityButton')).tap()\n  \n  // Use traceCall() as a wrapper:\n  await detox.traceCall('Navigate to sanity', () =>\n    element(by.id('sanityButton')).tap());\n});\n")),(0,i.kt)("p",null,"This would have the ",(0,i.kt)("inlineCode",{parentName:"p"},"tap")," action traced to the final artifact, so it would look something like this:"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"User event",src:a(8950).Z,width:"944",height:"258"})),(0,i.kt)("p",null,"At the bottom right, you can see what portion of the test was spent in handling the whole navigation process: tap + screen push + screen rendering (i.e. action time, alongside Detox' inherent wait for the application to become idle)."),(0,i.kt)("h4",{id:"detoxtracestartsection-detoxtraceendsection"},(0,i.kt)("inlineCode",{parentName:"h4"},"detox.trace.startSection(), detox.trace.endSection()")),(0,i.kt)("p",null,"\u26a0\ufe0f ",(0,i.kt)("strong",{parentName:"p"},"Beta")),(0,i.kt)("p",null,"This is similar to the ",(0,i.kt)("inlineCode",{parentName:"p"},"traceCall()")," API, except that it gives more freedom with respect to when a section\u2019s start and ending times are defined, so as to monitor a nontrivial flow. As a usage example:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"it('Verify sanity things', async () => {\n  try {\n    detox.trace.startSection('Turn off notifications');\n    await element(by.id('gotoNotifications')).tap();\n    await element(by.id('notificationsToggle')).tap();\n    await device.pressBack();    \n  } finally {\n    detox.trace.endSection('Turn off notifications');    \n  }\n});\n")),(0,i.kt)("p",null,"Effectively, ",(0,i.kt)("inlineCode",{parentName:"p"},"start")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"end")," can even be called in two complete different places - such as a ",(0,i.kt)("inlineCode",{parentName:"p"},"before")," and an ",(0,i.kt)("inlineCode",{parentName:"p"},"after"),". But that is discouraged. In fact, ",(0,i.kt)("strong",{parentName:"p"},"usage of ",(0,i.kt)("inlineCode",{parentName:"strong"},"detox.traceCall()")," is the recommended way of tracing things, altogether.")))}c.isMDXComponent=!0},8950:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/timeline-artifact-userEvent-a5a014880bdcf3c953fb21db902ee903.png"}}]);