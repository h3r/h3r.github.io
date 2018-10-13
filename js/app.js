class APP {

    constructor(){

        //Play flip sound when hovering card
        var card = window.document.getElementById("flipcard");
        if(Modernizr.touchevents){
            function flip(){
                if(card.classList.contains("hover-left") || card.classList.contains("hover-right")){
                    this.playSound( "card-flip-out", 0.5, 0.9);
                    card.classList.remove("hover-left");
                    card.classList.remove("hover-right");
                }else{
                    if(arguments && arguments[0].deltaX < 0)
                        card.classList.add("hover-left");
                    else
                        card.classList.add("hover-right");
                    this.playSound( "card-flip", 0.5, 1.2);
                   
                }
            }
                  
            var hammertime = new Hammer(card, {});
            hammertime.on('swipe', flip.bind(this));
        }else{
            
            card.addEventListener("mouseenter", (function(e){
                this.playSound( "card-flip", 0.5, 1.2);
            }).bind(this));
            card.addEventListener("mouseleave", (function(e){
                this.playSound( "card-flip-out", 0.5, 0.9);
            }).bind(this));
        }
    }

    playSound( sound_name, volume, speed){
        if(!this[sound_name])
            this[sound_name] = document.getElementById(sound_name);
        if(!this[sound_name])
            return console.warn("audio track not found:", sound_name);
        
        
        this[sound_name].playbackRate = Math.max(0,speed || 1) ;
        this[sound_name].volume = Math.max(0,volume || 1);
        try{this[sound_name].play()}catch(e){};
    }

    skillBars( domID, properties ){
        properties = properties || {};

        var list = document.createElement("ul");
        list.classList.add('skillbars');
        document.getElementById( domID ).appendChild( list );

        for(var p in properties){
            var item = document.createElement('li');
            item.classList.add('skillbar');
            item.id = p.toLowerCase();

            var label = document.createElement('span');
            label.classList.add('label');
            label.innerText = p;
            item.appendChild(label);

            var bar = document.createElement('div');
            bar.classList.add('bar');
            
            item.appendChild(bar);

            var badge = document.createElement('span');
            badge.innerText = properties[p];
            badge.setAttribute('value', properties[p]);
            badge.classList.add('badge');
            bar.appendChild(badge);

            list.appendChild(item);
            window.bar = bar;  
        }

        setTimeout(()=>{
            document.querySelectorAll('.skillbar').forEach( e => e.style.opacity = 1 );
            document.querySelectorAll('.bar').forEach( e => {
           
                e.style.width = "calc("+e.children[0].getAttribute('value')+" - 76px)"
            });
        },500);

    }
}
var app = new APP();

app.skillBars('skills', {
    "JavaScript": "90%",
    "C/C++": "98%",
    "Shading" : "86%"
})

//document.querySelector("#projects span").innerText = 
//document.querySelector("#teaching span").innerText =
axios("https://api.github.com/users/h3r/repos?type=all").then(r=>r.data).then(d => document.querySelector("#projects span").innerText = d.length);
axios("/teaching").then(r=>r.data).then(d=> document.querySelector("#teaching span").innerText = (d.match(/a href/g) || []).length);
//https://api.github.com/users/h3r/repos?type=all


