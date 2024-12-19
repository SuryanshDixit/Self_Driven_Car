class Visualizer{
    static drawNetwork(ctx,network){
        const margin=50;
        const left=margin;
        const top=margin;
        const width=ctx.canvas.width-margin*2;
        const height=ctx.canvas.height-margin*2;

        const levelHeight=height/network.levels.length;

        for(let i=network.levels.length-1;i>=0;i--){
            const levelTop=top+
                lerp(
                    height-levelHeight,
                    0,
                    network.levels.length==1
                        ?0.5
                        :i/(network.levels.length-1)
                );

            ctx.setLineDash([7,3]);
            Visualizer.drawLevel(ctx,network.levels[i],
                left,levelTop,
                width,levelHeight,
                i==network.levels.length-1
                    ?['🠉','🠈','🠊','🠋']
                    :[]
            );
        }
    }

    static drawLevel(ctx,level,left,top,width,height,outputLabels){
        const right=left+width;
        const bottom=top+height;

        const {inputs,outputs,weights,biases}=level;

        for(let i=0;i<inputs.length;i++){
            for(let j=0;j<outputs.length;j++){
                ctx.beginPath();
                ctx.moveTo(
                    Visualizer.#getNodeX(inputs,i,left,right),
                    bottom
                );
                ctx.lineTo(
                    Visualizer.#getNodeX(outputs,j,left,right),
                    top
                );
                ctx.lineWidth=2;
                ctx.strokeStyle=getRGBA(weights[i][j]);
                ctx.stroke();
            }
        }

        const nodeRadius=18;
        for(let i=0;i<inputs.length;i++){
            const x=Visualizer.#getNodeX(inputs,i,left,right);
            ctx.beginPath();
            ctx.arc(x,bottom,nodeRadius,0,Math.PI*2);
            ctx.fillStyle="black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x,bottom,nodeRadius*0.6,0,Math.PI*2);
            ctx.fillStyle=getRGBA(inputs[i]);
            ctx.fill();
        }
        
        for(let i=0;i<outputs.length;i++){
            const x=Visualizer.#getNodeX(outputs,i,left,right);
            ctx.beginPath();
            ctx.arc(x,top,nodeRadius,0,Math.PI*2);
            ctx.fillStyle="black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x,top,nodeRadius*0.6,0,Math.PI*2);
            ctx.fillStyle=getRGBA(outputs[i]);
            ctx.fill();

            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.arc(x,top,nodeRadius*0.8,0,Math.PI*2);
            ctx.strokeStyle=getRGBA(biases[i]);
            ctx.setLineDash([3,3]);
            ctx.stroke();
            ctx.setLineDash([]);

            if(outputLabels[i]){
                ctx.beginPath();
                ctx.textAlign="center";
                ctx.textBaseline="middle";
                ctx.fillStyle="black";
                ctx.strokeStyle="white";
                ctx.font=(nodeRadius*1.5)+"px Arial";
                ctx.fillText(outputLabels[i],x,top+nodeRadius*0.1);
                ctx.lineWidth=0.5;
                ctx.strokeText(outputLabels[i],x,top+nodeRadius*0.1);
            }
        }
    }

    static #getNodeX(nodes,index,left,right){
        return lerp(
            left,
            right,
            nodes.length==1
                ?0.5
                :index/(nodes.length-1)
        );
    }
}

function getRGBA(value){
    const alpha=Math.abs(value);
    const R=value<0?0:255;
    const G=R;
    const B=value>0?0:255;
    return "rgba("+R+","+G+","+B+","+alpha+")";
}



const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;
// canvas.height = window.innerHeight;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2,carCanvas.width*0.9);
// const road2 = new Road(canvas.width/4,canvas.width*0.9);


const N = 1000;
const cars = generateCars(N);
let bestCar = cars[0]; // Presume the first car is the best initially

// Load the best brain from localStorage if it exists
const bestBrain = localStorage.getItem("bestBrain");
if (bestBrain) {
    const parsedBestBrain = JSON.parse(bestBrain);

    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(JSON.stringify(parsedBestBrain)); // Deep copy the brain to avoid unintended side effects
        
        if (i !== 0) {
            // Mutate all cars except the first one
            NeuralNetwork.mutate(cars[i], 0.1);
            // Uncomment the following line if you want to replace `bestCar` logic
            // bestCar = cars[i];
        }
    }
}


// const car2 = new Car(road.getLaneCenter(0),100,30,50);
const traffic = [
    new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2)
];

// car.draw(ctx);
// car2.draw(ctx);


animate();
// Saving the best car or you can say best brain:
function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain)
    );
}

// Destroying the bestcar: 
function discard(){
    localStorage.removeItem("bestBrain");
}


// Generating Cars for our simulation: 
function generateCars(){
    const cars = [];
    for(let i = 0;i<N; i++){
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"))
    }
    return cars;
}


// const visualizer = new Visualizer();
function animate(time, bestCar){
    // Updating(animating) the traffic cars:
    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }

    // Updating the all the cars:
    for(let i = 0; i<cars.length;i++){
    cars[i].update(road.borders,traffic);
    }

    bestCar = cars.find(
        c=>c.y==Math.min(
            ...cars.map(c=>c.y)
        )
    );

    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);// This makes the car to be fixed and road moving scene!
    road.draw(carCtx);
    for(let i = 0; i<traffic.length;i++){
        traffic[i].draw(carCtx,"orange");
    }
    carCtx.globalAlpha = 0.2;
    for(let i = 0; i<cars.length;i++){
    cars[i].draw(carCtx,"blue");
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx,"blue",true);
    carCtx.restore();
    networkCtx.lineDashOffset = -time/50; 
    Visualizer.drawNetwork(networkCtx,bestCar.brain);
    requestAnimationFrame(animate);
}

