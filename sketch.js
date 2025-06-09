let enemies_count = 0;
let countPlatforms = 1;
var background_music = new Audio("background_music.mp3");
var damage_effect = new Audio("damaged.mp3");
let clouds = [];
let moon = [];
let church = [];
let trees = [];
let platforms = [];
let house = [];
let sounds_on = true;
let gameState = 'playing';
let soundSlider;
let basefloor = 154;
let cameraOffset = 0;
const cameraMargin = 400; // Отступ от границы, при котором начинается промотка
const worldWidth = 2000;
let isPaused = false;

function generatePlatforms(x, y){
    platforms.push({
        color: color(88,10,10),
        x: x,
        y: y,
        width: 110,
        height: 20,
        drawPlatforms: function(){
            noStroke();
            fill(this.color);
            rect(this.x, this.y, this.width, this.height);
        },
        checkCollision: function(character){
            return (
                character.x + character.width > this.x &&
                character.x < this.x + this.width &&
                character.y + character.height >= this.y &&
                character.y + character.height <= this.y + 10
            );
        }
    });
}

function generateClouds(x, y, weight, speed, x_limit, distance){
        clouds.push({
        color: color(132, 32, 32),
        x: x,
        y: y,
        weight: weight,
        speed: speed,
        x_limit: x_limit,
        distance: distance,
        drawCloud: function(){
            stroke(this.color); //cloud 1
            strokeWeight(this.weight - 200);
            point(this.x - 340, this.y + 90);
            strokeWeight(this.weight - 150);
            point(this.x - 280, this.y + 70);
            strokeWeight(this.weight - 100);
            point(this.x - 200, this.y + 40);
            strokeWeight(this.weight - 50);
            point(this.x - 100, this.y + 20);
            strokeWeight(this.weight);
            point(this.x, this.y);
            strokeWeight(this.weight - 50);
            point(this.x + 100, this.y + 20);
            strokeWeight(this.weight - 100);
            point(this.x + 200, this.y + 40);
            strokeWeight(this.weight - 150);
            point(this.x + 280, this.y + 70);
            strokeWeight(this.weight - 200);
            point(this.x + 340, this.y + 90);
        },
        cloudMove: function(){
            if (this.x < this.x_limit)
                this.x += this.speed;
            else
                this.x = -this.distance;
        }
        });
}

function generateMoon(x, y, weight){
    moon.push({
        color: color(225, 104, 104),
        color_bright: color(245, 124, 124),
        x: x,
        y: y,
        weight: weight,
        drawMoon: function(){
            stroke(this.color); //moon
            strokeWeight(this.weight);
            point(this.x, this.y);
            stroke(this.color_bright);
            strokeWeight(this.weight - 20);
            point(this.x, this.y);
            stroke(this.color); //moon
            strokeWeight(this.weight - 80);
            point(this.x - 30, this.y);
        }
    });
}

function generateChurch(x, y){
    church.push({
        color: color(40, 20, 20),
        x: x,
        y: y,
        drawChurch: function(){
            noStroke();
            fill(this.color);
            rect(this.x, this.y, 300, this.y - 238);
            rect(this.x, this.y - 60, 30, this.y - 250);
            rect(this.x + 270, this.y - 60, 30, this.y - 250);
            triangle(this.x - 10, this.y - 60, this.x + 40, this.y - 60, this.x + 15, this.y - 90);
            triangle(this.x + 260, this.y - 60, this.x + 310, this.y - 60, this.x + 285, this.y - 90);
            triangle(this.x + 60, this.y + 90, this.x + 240, this.y + 70, this.x + 150, this.y - 230);
        }
    });
}

function generateHouse(x, y){
    house.push({
        color: color(40, 20, 20),
        x: x,
        y: y,
        drawHouse: function(){
            noStroke();
            fill(this.color);
            triangle(this.x, this.y, this.x + 75, this.y - 170, this.x + 150, this.y);
        }
    });
}

function generateTree(x, y){
    trees.push({
        color: color(24, 22, 21),
        x: x,
        y: y,
        drawTree: function(){
            fill(this.color);
            triangle(this.x, this.y + 23, this.x + 40, this.y + 23, this.x + 20, this.y - 300);
            triangle(this.x + 10, this.y, this.x - 10, this.y - 90, this.x + 10, this.y - 30);
            triangle(this.x + 20, this.y - 120, this.x + 40, this.y - 200, this.x + 20, this.y - 140);
        }
    });
}


function setup(){
    createCanvas(1024, 576);
    background_music.volume = 0.05;
    damage_effect.volume = 0.2;  
    soundSlider = createSlider(0, 255, 125);
    soundSlider.position(-200, -200); //за экраном
    soundSlider.size(200);
    cameraOffset = 0;
    //character
    floor = {
        logicalHeight: basefloor,
        visualHeight: 154,
        height: basefloor,
        width: 4000,
        color: color(88,10,10),
        drawFloor: function(){
            noStroke();
            fill(this.color);
            rect(0, height - this.visualHeight, this.width, this.visualHeight);
        }
    };
    
    gameChar = {
        gameChar_x: 512,
        gameChar_y: 362,
        width: 60,
        height: 60,
        grounded: false,
        speedGravity: -5,
        color: color(255, 250, 250),
        color_dark: color(169, 169, 169),
        dead: false,
        damageSoundPlayed: false,
        windowOpen: false,
        onPlatform: false,
        drawCharacter: function(){ //Character - FRONT
            noStroke();
            fill(this.color);
            rect(this.gameChar_x, this.gameChar_y, this.width, this.height);
        },
        gravity: function() { 
            if (this.speedGravity > -5)
                this.speedGravity--;
            if (this.gameChar_y + this.height < height - floor.logicalHeight){
                this.gameChar_y -= this.speedGravity;
                this.grounded = false;
            } else {
                this.grounded = true;
            }
        },
        jump: function() {
            if (this.grounded){
                this.speedGravity = 15;
                this.gameChar_y -= this.speedGravity;
                this.grounded = false;
                this.onPlatform = false;
            }
        },
        moveLeft: function() {
            this.gameChar_x -= 4;
            if (this.gameChar_x < cameraOffset + cameraMargin){
                cameraOffset = this.gameChar_x - cameraMargin;
                if (cameraOffset < 0){
                    cameraOffset = 0;
                }
            }
            if (this.gameChar_x < 0){
                this.gameChar_x = 0;
            }
        },
        moveRight: function() {
            this.gameChar_x += 4;
            if (this.gameChar_x > cameraOffset + width - cameraMargin - this.width){
                cameraOffset = this.gameChar_x - (width - cameraMargin - this.width);
                if (cameraOffset > worldWidth - width){
                    cameraOffset = worldWidth - width;
                }
            }
            if (this.gameChar_x > worldWidth - this.width){
                this.gameChar_x = worldWidth - this.width;
            }
        },
       movement: function() {
            if (!this.dead && !this.windowOpen){
                if (this.grounded && keyIsDown(32)){
                    this.jump();
                }
                if (keyIsDown(65)){
                    this.moveLeft();
                }
                if (keyIsDown(68)){
                    this.moveRight();
                }
            }
        },
        canyonCheck: function(){
            if ((this.gameChar_y + this.height >= height - floor.visualHeight) && 
            canyon.danger.includes(gameChar.gameChar_x)){
            this.dead = true;
            }
        },
        checkPlatform: function()
        {   this.onPlatform = false;
            for (let i = 0; i < platforms.length; i++){
                if (this.gameChar_x + this.width > platforms[i].x && 
                    this.gameChar_x < platforms[i].x + platforms[i].width &&
                    this.gameChar_y + this.height >= platforms[i].y - 5 && 
                    this.gameChar_y + this.height <= platforms[i].y + 15 &&
                    this.speedGravity <= 0){
                    this.gameChar_y = platforms[i].y - this.height;
                    floor.logicalHeight = platforms[i].y + platforms[i].height;
                    this.onPlatform = true;
                    this.grounded = true;
                    this.speedGravity = 0;
                    break;
                }
            }
        if (!this.onPlatform) {
            floor.logicalHeight = basefloor;
        }
    },
        deadSound: function(){
            if (!this.damageSoundPlayed){
                damage_effect.play();
                this.damageSoundPlayed = true;
                if (shadows.game_start){
                   health.health -= 1;
                }
            }
        },
        deadAnimation: function(){
            if (this.dead){
                this.deadSound();
                if (this.gameChar_y <= height)
                    this.gameChar_y -= this.speedGravity;
                else {
                    this.gameChar_y = height - floor.visualHeight - this.width;
                    if (this.gameChar_x < 150){
                        this.gameChar_x = 50;
                    } else {
                        this.gameChar_x = 250;
                    }
                    this.grounded = true;
                    this.dead = false;
                    this.damageSoundPlayed = false;
                    gameState = 'gameOver';
                }
            }
        },
        light: function() {
            if (gameItem.picked_up && !window_object.game_over && !isPaused && !shadows.for_window){
                if (keyIsDown(69) && gameItem.charge < 100){ // E - зарядка
                    gameItem.charge += 1;
                    this.lightActive = false;
                } 
                else if (keyIsDown(16) && gameItem.charge > 0 && !keyIsDown(69)){ // Shift - использование
                    stroke(gameItem.light_color);
                    strokeWeight(200);
                    point(this.gameChar_x + 27, this.gameChar_y + 30);
                    gameItem.charge -= 1;
                    this.lightActive = true;
                    if ((shadows.enemy_x <= this.gameChar_x + 112) && 
                        (shadows.enemy_x >= this.gameChar_x - 112)){
                        shadows.enemy_dead = true;
                        enemies_count += 1;
                    }
                }
            }
        }
    };

    generateMoon(150, 100, 300);

    gameItem = {
        item_x: 400,
        item_y: 400,
        light_color: color(245, 222, 179, 50),
        picked_up: false,
        charge: 100,
        draw: function(x, y){
            stroke(0, 0, 0);
            strokeWeight(7);
            fill(212, 166, 55);
            rect(x, y, 25, 22);
            fill(0, 0, 0);
            triangle(x - 2, y, x + 27, y, x + 12, y - 20);
            strokeWeight(10);
            point(x + 12, y - 25);
            noStroke();
        },
        drawItem: function(){
            if (this.picked_up == true){
                this.item_x = 800;
                this.item_y = 530;
                this.draw(800, 530);
                textSize(20);
                fill(255, 255, 255);
                text("Press SHIFT to use", this.item_x + 40, this.item_y - 5);
                text("Press E to recharge", this.item_x + 40, this.item_y + 25);
                text(this.charge, 970, 35);
            } else {
            this.draw(this.item_x, this.item_y);
            }
        },
        noLight: function(){
            if (this.picked_up == false){
                stroke(this.light_color);
                strokeWeight(150);
                point(this.item_x + 10, this.item_y);
                if (gameChar.gameChar_x >= 350 && gameChar.gameChar_x <= 420 && gameChar.gameChar_y >= 340) {
                    this.picked_up = true;
                }
            }
        }
    };

    generateChurch(400, 330);
    generateHouse(1350, height - 154);
    generateTree(830, 400);
    generateTree(1750, 400);
    generateClouds(50, 300, 300, 0.8, 2400, 800);
    generateClouds(400, 100, 250, 1.5, 2400, 400);
    generatePlatforms(120, 320);
    
    canyon = {
        color_outside: color(56,5,5),
        color_inside: color(0, 0, 0, 100),
        x: 100,
        y: 422,
        danger: [],
        numbers: function(){
            for (var i = this.x; i <= this.x + 80; i++){
                this.danger.push(i);
            }
        },
        drawCanyon: function(){
            fill(this.color_outside);
            rect(this.x, this.y, this.x + 50, this.y - 268);
            fill(this.color_inside);
            rect(this.x + 10, this.y, this.x + 30, this.y - 100);
        }
    };

    darkness = {
        color_dark: color(0, 0, 0, 200),
        color_light: color(0, 0, 0, 150),
        draw_darkness: function(){
            noStroke();
            if (gameItem.picked_up == false){
                fill(this.color_dark);
            } 
            else {
                fill(this.color_light);
            }
            rect(0, 0, 4000, 576);
        }
    };

    shadows = {
    color: color(0, 0, 0),
    x: 520,
    y: 250,
    width: 50,
    height: 167,
    for_window: false,
    wasCreated: false,
    game_start: false,
    enemy_width: random(10, 50),
    enemy_height: random(40, 167),
    min_spawn_distance: 250,
    max_spawn_distance: 500,
    enemy_x: 0,
    enemy_direction: "left",
    enemy_dead: false,
    drawShadow: function() {
        if (gameItem.picked_up && !this.wasCreated){
                fill(this.color);
                rect(this.x, this.y, this.width, this.height);
                if (gameChar.gameChar_x > this.x - 65){
                    this.for_window = true;
                }
            }
            if (this.game_start && !this.enemy_dead && !window_object.game_over){
                noStroke();
                fill(this.color);
                rect(this.enemy_x, height - (this.enemy_height + floor.visualHeight), this.enemy_width, this.enemy_height);
                if ((gameChar.gameChar_x < this.enemy_x + this.enemy_width && gameChar.gameChar_x + gameChar.width > this.enemy_x && 
                     gameChar.gameChar_y + gameChar.height > height - (this.enemy_height + floor.visualHeight))) {
                    gameChar.deadSound();
                    this.enemy_dead = true;
                } else if (this.enemy_direction == "right"){
                    this.enemy_x += 6;
                } else {
                    this.enemy_x -= 6;
                }
                if (this.enemy_x > 2000 || this.enemy_x < 0){
                    this.enemy_dead = true;
                }
            }
    },
    enemySpawn: function(){
        if (this.enemy_dead){
            gameChar.damageSoundPlayed = false;
            let spawn_distance = random(this.min_spawn_distance, this.max_spawn_distance);
            if (random() > 0.5){
                this.enemy_x = gameChar.gameChar_x + spawn_distance;
                this.enemy_direction = "left";
            } else {
                this.enemy_x = gameChar.gameChar_x - spawn_distance;
                this.enemy_direction = "right";
            }
            this.enemy_width = random(10, 50);
            this.enemy_height = random(40, 167);
            this.enemy_dead = false;
            }
        }
    };

    health = {
        health: 3,
        color: color(255, 250, 250),
        xy1: 5,
        x23: 20,
        y2: 10,
        y3: 30,
        drawHealth: function(){
            if (shadows.game_start){
                if (this.health >= 1){
                    noStroke();
                    fill(this.color);
                    triangle(this.xy1, this.xy1, this.x23, this.y2, this.x23, this.y3);
                    triangle(this.xy1 + 30, this.xy1, this.x23, this.y2, this.x23, this.y3);
                }
                if (this.health >= 2){
                    noStroke();
                    fill(this.color);
                    triangle(this.xy1 + 40, this.xy1, this.x23 + 40, this.y2, this.x23 + 40, this.y3);
                    triangle(this.xy1 + 70, this.xy1, this.x23 + 40, this.y2, this.x23 + 40, this.y3);
                }
                if (this.health >= 3){
                    noStroke();
                    fill(this.color);
                    triangle(this.xy1 + 80, this.xy1, this.x23 + 80, this.y2, this.x23 + 80, this.y3);
                    triangle(this.xy1 + 110, this.xy1, this.x23 + 80, this.y2, this.x23 + 80, this.y3);
                }
                textSize(20);
                fill(150, 145, 145);
                text("defeated enemies: " + enemies_count, this.xy1, this.xy1 + 50);
            }
        }
    };
    
    heal = {
        x: 0,
        y: height - floor.visualHeight - 35,
        color: color(255, 250, 250),
        active: false,
        timer: 0,
        showDelay: 10000,
        spawnedFirstTime: false,
        xy1: 0,
        x23: 15,
        y2: 10,
        y3: 30,
        spawn: function() {
            let validPosition = false;
            let attempts = 0;
            while (!validPosition && attempts < 50){
                attempts++;
                this.x = random(50, worldWidth - 50); 
                // проверка что не над ямой
                validPosition = true;
                for (let i = this.x; i < this.x + 30; i++){
                    if (canyon.danger.includes(i)){
                        validPosition = false;
                        break;
                    }
                }
            }
            if (validPosition) {
                this.active = true;
            }
        },
        update: function() { // старт
            if (shadows.game_start && !this.spawnedFirstTime){
                this.spawn();
                this.spawnedFirstTime = true;
            }
            if (this.active) { // проверка подбора
                if (gameChar.gameChar_x + gameChar.width > this.x &&
                    gameChar.gameChar_x < this.x + 30 &&
                    gameChar.gameChar_y + gameChar.height > this.y &&
                    gameChar.gameChar_y < this.y + 30){
                    if (health.health < 3){
                        health.health += 1;
                    }
                    this.active = false;
                    this.timer = millis();
                }
            } 
            else if (this.timer > 0 && millis() - this.timer > this.showDelay){
                this.spawn();
                this.timer = 0;
            }
        },
        drawHeal: function() {
            if (this.active){
                push();
                noStroke();
                fill(this.color);
                translate(this.x, this.y);
                triangle(this.xy1, this.xy1, this.x23, this.y2, this.x23, this.y3);
                triangle(this.xy1 + 30, this.xy1, this.x23, this.y2, this.x23, this.y3);
                pop();
            }
        }
    };

    window_object = {
        window_color: color(255, 255, 255, 100),
        window_x: width/2 - 200,
        window_y: height/2 - 150,
        game_over: false,
        buttonCreated: false,
        drawWindow: function(){
            if (shadows.for_window){
                gameChar.windowOpen = true;
                fill(this.window_color);
                rect(this.window_x, this.window_y, this.window_x + 200, this.window_y + 20);
                textSize(28);
                fill(255, 255, 255);
                text("Use your light to fight the darkness.", this.window_x + 30, this.window_y + 40);
                text("Press E to start.", this.window_x + 150, this.window_y + 80);
                if (keyIsDown(69)){
                    gameChar.windowOpen = false;
                    shadows.wasCreated = true;
                    shadows.for_window = false;
                    shadows.game_start = true;
                }
            }
            if (health.health <= 0){
                this.game_over = true;
                gameChar.windowOpen = true;
                fill(this.window_color);
                rect(this.window_x, this.window_y, this.window_x + 200, this.window_y + 20);
                textSize(50);
                fill(255, 255, 255);
                text("GAME OVER", this.window_x + 90, this.window_y + 80);
                restartButton.show(); // Показываем кнопку рестарта
                noLoop(); // Останавливаем цикл отрисовки
            }
        },
            drawPauseMenu: function() {
            fill(0, 0, 0, 150);
            rect(0, 0, width, height);
            fill(this.window_color);
            rect(this.window_x, this.window_y, 400, 300);
            textSize(50);
            fill(255);
            textAlign(CENTER, CENTER);
            text("PAUSED", this.window_x + 200, this.window_y + 80);
            soundSlider.position(this.window_x + 100, this.window_y + 120);
            textSize(20);
            textAlign(LEFT);
            text("Volume:", this.window_x + 100, this.window_y + 110);
            restartButton.position(this.window_x + 125, this.window_y + 180);
            restartButton.show();
            background_music.volume = soundSlider.value() / 255;
            damage_effect.volume = soundSlider.value() / 255;
        }
    };
    
    restartButton = createButton('Try again');
    restartButton.size(150, 50);
    restartButton.position(width / 2 - 50, height / 2 + 50); 
    restartButton.mousePressed(resetGame); 
    restartButton.hide(); 
}

function resetGame() {
    cameraOffset = 0;
    gameState = 'playing';
    gameChar.dead = false;
    gameChar.windowOpen = false;
    gameChar.gameChar_x = 512;
    gameChar.gameChar_y = 362;
    gameChar.speedGravity = -5;
    gameChar.width = 60;
    gameChar.height = 60;
    gameItem.item_x = 400;
    gameItem.item_y = 400;
    gameItem.charge = 100;
    shadows.wasCreated = false;
    shadows.game_start = false;
    enemies_count = 0;
    gameItem.picked_up = false;
    health.health = 3;
    window_object.game_over = false;
    background_music.play();
    restartButton.hide(); 
    heal.active = false;
    heal.timer = 0;
    heal.spawnedFirstTime = false;
    heal.x = 0;
    soundSlider.position(-200, -200); 
    isPaused = false;
    loop();
}

function keyPressed() {
    if (keyCode === ESCAPE){
        isPaused = !isPaused;
        
        if (isPaused){
            noLoop();
        } else {
            soundSlider.position(-200, -200);
            restartButton.hide();
            loop();
        }
        return false;
    }
}

function draw() {
    background_music.play();
    background(179, 57, 57);
    translate(-cameraOffset, 0); //движение камеры
    for (let object of moon){
        object.drawMoon();
    }
    for (let object of clouds){
        object.drawCloud();
        object.cloudMove();
    }
    floor.drawFloor();
    for (let object of church){
        object.drawChurch();
    }
    for (let object of house){
        object.drawHouse();
    }
    for (let object of trees){
        object.drawTree();
    }
    for (let object of platforms){
        object.drawPlatforms();
    }
    canyon.drawCanyon();
    canyon.numbers(); //считает опасные x
    shadows.enemySpawn();
    shadows.drawShadow();
    gameChar.drawCharacter();
    heal.update();
    heal.drawHeal();
    gameItem.noLight();
    darkness.draw_darkness();
    if (!gameItem.picked_up){
        gameItem.drawItem();
    }
    
    gameChar.checkPlatform();
    gameChar.gravity();
    gameChar.movement();
    gameChar.light();
    gameChar.canyonCheck();
    gameChar.deadAnimation();
    
    resetMatrix(); //перемещение камеры. объекты после этой строки фиксируются
    
    if (isPaused){
        window_object.drawPauseMenu();
        return;
    }
    window_object.drawWindow();
    health.drawHealth();
    if (gameItem.picked_up){
        gameItem.drawItem();
    }
    background_music.volume = soundSlider.value() / 255;
    damage_effect.volume = soundSlider.value() / 255;
}
