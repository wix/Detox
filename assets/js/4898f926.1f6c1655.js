"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[6068],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>g});var o=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,o,i=function(e,t){if(null==e)return{};var n,o,i={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var u=o.createContext({}),l=function(e){var t=o.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},p=function(e){var t=l(e.components);return o.createElement(u.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},c=o.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,u=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),c=l(n),g=i,h=c["".concat(u,".").concat(g)]||c[g]||d[g]||r;return n?o.createElement(h,a(a({ref:t},p),{},{components:n})):o.createElement(h,a({ref:t},p))}));function g(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,a=new Array(r);a[0]=c;var s={};for(var u in t)hasOwnProperty.call(t,u)&&(s[u]=t[u]);s.originalType=e,s.mdxType="string"==typeof e?e:i,a[1]=s;for(var l=2;l<r;l++)a[l]=n[l];return o.createElement.apply(null,a)}return o.createElement.apply(null,n)}c.displayName="MDXCreateElement"},5780:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>u,contentTitle:()=>a,default:()=>d,frontMatter:()=>r,metadata:()=>s,toc:()=>l});var o=n(7462),i=(n(7294),n(3905));const r={},a="Developing Your App While Writing Tests",s={unversionedId:"guide/developing-while-writing-tests",id:"version-20.x/guide/developing-while-writing-tests",title:"Developing Your App While Writing Tests",description:"If your app requires active development, such as adding testID fields for tests, this is a good workflow. It allows you to work both on your app and your tests at the same time.",source:"@site/versioned_docs/version-20.x/guide/developing-while-writing-tests.md",sourceDirName:"guide",slug:"/guide/developing-while-writing-tests",permalink:"/Detox/docs/guide/developing-while-writing-tests",draft:!1,editUrl:"https://github.com/wix/Detox/edit/master/docs/versioned_docs/version-20.x/guide/developing-while-writing-tests.md",tags:[],version:"20.x",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Mocking User Activity",permalink:"/Detox/docs/guide/mocking-user-activity"},next:{title:"Setting Up an Android Development & Testing Environment",permalink:"/Detox/docs/guide/android-dev-env"}},u={},l=[{value:"Step 1: Build Your App in Debug",id:"step-1-build-your-app-in-debug",level:3},{value:"Step 2: Make Sure Your React-Native Packager is Running",id:"step-2-make-sure-your-react-native-packager-is-running",level:3},{value:"Step 3: Run Detox Tests",id:"step-3-run-detox-tests",level:3},{value:"Step 4: Make Changes to Your App\u2019s Codebase as Usual",id:"step-4-make-changes-to-your-apps-codebase-as-usual",level:3},{value:"Step 5: Re-run Detox Tests Without Re-installing the App",id:"step-5-re-run-detox-tests-without-re-installing-the-app",level:3}],p={toc:l};function d(e){let{components:t,...n}=e;return(0,i.kt)("wrapper",(0,o.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"developing-your-app-while-writing-tests"},"Developing Your App While Writing Tests"),(0,i.kt)("blockquote",null,(0,i.kt)("p",{parentName:"blockquote"},"If your app requires active development, such as adding testID fields for tests, this is a good workflow. It allows you to work both on your app and your tests at the same time.")),(0,i.kt)("p",null,"The main idea behind this workflow is to run your app in debug with Detox on a simulator. Once the app is up and running, it will still be connected to the React Native packager. This means that you\u2019ll be able to do JavaScript code modifications in your app codebase and press CMD+R to reload the bundle inside the Detox simulator."),(0,i.kt)("h3",{id:"step-1-build-your-app-in-debug"},"Step 1: Build Your App in Debug"),(0,i.kt)("p",null,"Detox is going to need the executable for your app. This means we need to build it first.\nSince we want a build that\u2019s connected to the live React Native packager (to update bundle changes),\nwe\u2019re going to need a ",(0,i.kt)("em",{parentName:"p"},"debug")," build:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"detox build -c ios.sim.debug # or android.emu.debug\n")),(0,i.kt)("p",null,"Check out ",(0,i.kt)("a",{parentName:"p",href:"/Detox/docs/introduction/project-setup"},"Introduction > Building with Detox")," for more details."),(0,i.kt)("h3",{id:"step-2-make-sure-your-react-native-packager-is-running"},"Step 2: Make Sure Your React-Native Packager is Running"),(0,i.kt)("p",null,"If you can\u2019t see a React Native packager instance running in a terminal, you can run it manually by typing:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"npx react-native start\n")),(0,i.kt)("p",null,"The packager instance will reload the JavaScript bundle of your app when you press CMD+R in the simulator window.\nThis will allow you to make modifications in your app codebase."),(0,i.kt)("h3",{id:"step-3-run-detox-tests"},"Step 3: Run Detox Tests"),(0,i.kt)("p",null,"Type the following inside your project root:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"detox test -c ios.sim.debug # or android.emu.debug\n")),(0,i.kt)("p",null,"This will use Detox to find the app executable we\u2019ve built in step 1, install it on the device and run Detox tests against it."),(0,i.kt)("h3",{id:"step-4-make-changes-to-your-apps-codebase-as-usual"},"Step 4: Make Changes to Your App\u2019s Codebase as Usual"),(0,i.kt)("p",null,"You can keep working on the JavaScript codebase of your app as usual.\nAs long as you keep the simulator from step 3 running, you\u2019ll be able to press CMD+R inside and reload your app with the new changes."),(0,i.kt)("h3",{id:"step-5-re-run-detox-tests-without-re-installing-the-app"},"Step 5: Re-run Detox Tests Without Re-installing the App"),(0,i.kt)("p",null,"You can make changes to your Detox tests as well. When you want to re-run your tests on the device,\nwe recommend adding ",(0,i.kt)("inlineCode",{parentName:"p"},"--reuse")," flag to save your time when running the tests."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"detox test -c ios.sim.debug --reuse # or android.emu.debug\n")),(0,i.kt)("p",null,"By default, Detox re-installs the app before picking every next test suite which is redundant in this situation\nsince your app code changes are delivered via network with React Native packager, and the app binary itself does\nnot change."),(0,i.kt)("p",null,'You should not use this option if you made native code changes or if your app relies on local ("disk") storage.'))}d.isMDXComponent=!0}}]);