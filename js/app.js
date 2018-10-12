// var git = {
//     repos : {
//         get( owner, repo ){
//             return axios("https://api.github.com/repos/"+owner+"/"+repo).then( e => e.data );
//         },
//         list( user ){
//             return axios("https://api.github.com/users/"+user+"/repos").then( e => e.data );
//         }
//     }
// }

class APP {

    constructor(){
        //Play flip sound when hovering card
        var card = document.getElementById("flipcard");
        card.addEventListener("mouseenter", (function(e){
            this.playSound( "card-flip", 0.5, 1.2);
        }).bind(this));
        card.addEventListener("mouseleave", (function(e){
            this.playSound( "card-flip-out", 0.5, 0.9);
        }).bind(this));
    }

    playSound( sound_name, volume, speed){
        if(!this[sound_name])
            this[sound_name] = document.getElementById(sound_name);
        if(!this[sound_name])
            return console.warn("audio track not found:", sound_name);
        
        
        this[sound_name].playbackRate = Math.max(0,speed || 1) ;
        this[sound_name].volume = Math.max(0,volume || 1);
        this[sound_name].play();
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
    /* //parallax effect : https://codemyui.com/parallax-effect-hover/
    $('html').mousemove(function(e){
        
        var wx = $(window).width();
        var wy = $(window).height();
        
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        
        var newx = x - wx/2;
        var newy = y - wy/2;
        
        $('span').text(newx + ", " + newy);
        
        $('#wrapper div').each(function(){
            var speed = $(this).attr('data-speed');
            if($(this).attr('data-revert')) speed *= -1;
            TweenMax.to($(this), 1, {x: (1 - newx*speed), y: (1 - newy*speed)});
            
        });
        
    });
    */
}
var app = new APP();

app.skillBars('skills', {
    "JavaScript": "90%",
    "C/C++": "98%",
    "Shading" : "86%"
})

