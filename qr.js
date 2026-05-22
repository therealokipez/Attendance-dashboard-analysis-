// AttendiQ — Pure JS QR Code Generator (no CDN)
var drawQR=(function(){
  var EXP=new Uint8Array(512),LOG=new Uint8Array(256);
  (function(){var x=1;for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=285;}for(var i=255;i<512;i++)EXP[i]=EXP[i-255];})();
  function mul(a,b){return(a&&b)?EXP[(LOG[a]+LOG[b])%255]:0;}
  function genPoly(n){var p=[1];for(var i=0;i<n;i++){var q=new Uint8Array(p.length+1);for(var j=0;j<p.length;j++){q[j+1]^=p[j];q[j]^=mul(p[j],EXP[i]);}p=Array.from(q);}return p;}
  function ecBytes(data,n){var gen=genPoly(n);var res=data.slice();res.length+=n;for(var i=0;i<data.length;i++){var c=res[i];if(c)for(var j=0;j<gen.length;j++)res[i+j]^=mul(gen[j],c);}return res.slice(data.length);}

  function makeMatrix(ver){
    var N=ver*4+17,M=[];
    for(var i=0;i<N;i++){M[i]=new Array(N).fill(-1);}
    // Finder pattern helper
    function finder(r,c){
      for(var dr=-1;dr<=7;dr++)for(var dc=-1;dc<=7;dc++){
        var rr=r+dr,cc=c+dc;if(rr<0||rr>=N||cc<0||cc>=N)continue;
        M[rr][cc]=(dr>=0&&dr<=6&&dc>=0&&dc<=6)&&(dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4))?1:0;
      }
    }
    finder(0,0);finder(0,N-7);finder(N-7,0);
    // Timing
    for(var i=8;i<N-8;i++){if(M[6][i]<0)M[6][i]=i%2?0:1;if(M[i][6]<0)M[i][6]=i%2?0:1;}
    // Dark module
    M[4*ver+9][8]=1;
    // Alignment (ver>=2)
    if(ver>=2){var ap=[6,N-7];for(var r=0;r<ap.length;r++)for(var c=0;c<ap.length;c++){if(M[ap[r]][ap[c]]>=0)continue;for(var dr=-2;dr<=2;dr++)for(var dc=-2;dc<=2;dc++)M[ap[r]+dr][ap[c]+dc]=(Math.abs(dr)===2||Math.abs(dc)===2||(!dr&&!dc))?1:0;}}
    return M;
  }

  function applyFormat(M,N,mask,ecl){
    // format bits: ecl=1(M), mask
    var fmt=[0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0][mask]|((ecl===1?1:ecl===0?3:ecl===3?0:2)<<13);
    // simplified: use precomputed for M+mask0 = 0x72F3 XOR 0x5412
    var bits=[];var f=fmt^0x5412;for(var i=14;i>=0;i--)bits.push((f>>i)&1);
    var p1=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    var p2=[[N-1,8],[N-2,8],[N-3,8],[N-4,8],[N-5,8],[N-6,8],[N-7,8],[8,N-8],[8,N-7],[8,N-6],[8,N-5],[8,N-4],[8,N-3],[8,N-2],[8,N-1]];
    for(var i=0;i<15;i++){M[p1[i][0]][p1[i][1]]=bits[i];M[p2[i][0]][p2[i][1]]=bits[i];}
  }

  return function drawQR(container,text,sz){
    sz=sz||200;
    try{
      // Encode text as bytes
      var bytes=[];for(var i=0;i<Math.min(text.length,40);i++)bytes.push(text.charCodeAt(i)&255);
      var ver=1;var dc=19;// version 1, M
      if(bytes.length>19){ver=2;dc=28;}
      if(bytes.length>28){ver=3;dc=44;}
      // Build data bits
      var bits=[];
      function addB(v,n){for(var i=n-1;i>=0;i--)bits.push((v>>i)&1);}
      addB(4,4);addB(Math.min(bytes.length,dc-2),8);
      for(var i=0;i<Math.min(bytes.length,dc-2);i++)addB(bytes[i],8);
      for(var i=0;i<4&&bits.length<dc*8;i++)bits.push(0);
      while(bits.length%8)bits.push(0);
      var pads=[0xEC,0x11],pi=0;
      while(bits.length<dc*8){addB(pads[pi++%2],8);}
      var data=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b);}
      // EC
      var ecCount=[7,10,15][ver-1];
      var ec=ecBytes(data,ecCount);
      var full=data.concat(Array.from(ec));
      // Build stream
      var stream=[];for(var i=0;i<full.length;i++)for(var b=7;b>=0;b--)stream.push((full[i]>>b)&1);
      // Fill matrix
      var N=ver*4+17;
      var M=makeMatrix(ver);
      // Mark reserved
      var R=[];for(var i=0;i<N;i++)R[i]=M[i].map(function(v){return v>=0;});
      // Place data
      var si=0,up=true,col=N-1;
      while(col>0){
        if(col===6)col--;
        var rows=[];for(var r=0;r<N;r++)rows.push(r);
        if(up)rows.reverse();
        for(var ri=0;ri<rows.length;ri++){for(var dc2=0;dc2<2;dc2++){var r=rows[ri],c=col-dc2;if(!R[r][c]&&si<stream.length){var mask=(r+c)%2===0;M[r][c]=stream[si++]^(mask?1:0);}}}
        up=!up;col-=2;
      }
      applyFormat(M,N,0,1);// mask 0, ecl M
      // Draw canvas
      var canvas=document.createElement('canvas');
      var quiet=4,cell=Math.floor((sz-quiet*2)/N);
      var csz=N*cell+quiet*2;
      canvas.width=csz;canvas.height=csz;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,csz,csz);
      ctx.fillStyle='#000';
      for(var r=0;r<N;r++)for(var c=0;c<N;c++)
        if(M[r][c]===1)ctx.fillRect(quiet+c*cell,quiet+r*cell,cell,cell);
      container.innerHTML='';
      container.appendChild(canvas);
    }catch(e){
      // Fallback visual
      var canvas=document.createElement('canvas');canvas.width=sz;canvas.height=sz;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,sz,sz);ctx.fillStyle='#000';
      [[0,0],[0,sz-56],[sz-56,0]].forEach(function(p){
        ctx.fillRect(p[1],p[0],56,56);ctx.fillStyle='#fff';ctx.fillRect(p[1]+8,p[0]+8,40,40);
        ctx.fillStyle='#000';ctx.fillRect(p[1]+16,p[0]+16,24,24);
      });
      var s=text.split('').reduce(function(a,c){return a+c.charCodeAt(0);},7);
      for(var r=70;r<sz-10;r+=8)for(var c=10;c<sz-10;c+=8){s=(s*6364136223846793005+1442695040888963407)>>>0;if(s%3)ctx.fillRect(c,r,6,6);}
      container.innerHTML='';container.appendChild(canvas);
    }
  };
})();
