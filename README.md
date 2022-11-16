# kd-tree-js

A JavaScript implementation of a kd tree that enables fast searches for nearest neighbors in d dimensions.

Supports range searches (finding points within ball R) and k-nearest-neighbor searches.

```javascript
let tree = new KDTree(points, ['x','y']);
let query_point = {x:0.2,y:0.3};
let R = 0.2;
let ball = tree.nearest_within_R(query_point, R);
let nearest_k = tree.nearest_k(query_point, 3);
let nearest_neighbor = tree.nearest(query_point);
```

`ball` will be an ordered list of objects. Each object is structured like `{point: {..., index: 9}, squared_distance: 0.02}` and orderd by squared distance. `nearest_k` has the same structure. `nearest_neighbor` is just the first element of the list from `nearest_k` for `k>0`.

## How to use

### p5 example

[p5 demo](https://editor.p5js.org/kimxsegfault/sketches/0--CV4nQn).

https://user-images.githubusercontent.com/10728380/202268588-79b53ec1-4c96-4831-aac2-9304eb4fc501.mov


```javascript
let points = [];
let N = 2000;
let tree;
let r = 3;

function setup() {
  createCanvas(400, 400);
  for(let i=0; i<N; ++i){
    points.push({
      x: random()*width,
      y: random()*height
    });
  }
  tree = new KDTree(points,['x','y']);
}

function draw_tree(T){
  if (T.left !== null){
    line(T.point.x,T.point.y,
         T.left.point.x, T.left.point.y );
    draw_tree(T.left);
  }
  if (T.right !== null){
    line(T.point.x,T.point.y,
         T.right.point.x, T.right.point.y );
    draw_tree(T.right);
  }
}

function draw() {
  background(250);

  let t = frameCount/10;
  let X = width/4 * cos(t) + width/2;
  let Y = width/4 * sin(t) + height/2;
  draw_tree(tree);
  fill(255);
  points.forEach(p=>{
    circle(p.x,p.y,2*r);
  })

  let R = 50;
  let k = 50;
  push();
  noFill();
  strokeWeight(2);
  circle(mouseX, mouseY, R*2);
  pop()

  push();
  let ball = tree.nearest_within_R({x:mouseX,y:mouseY},R);
  let nearest_k = tree.nearest_k({x:X,y:Y},k);

  fill(180);
  ball.forEach(n=>{
    circle(n.point.x,n.point.y,2*r);
  })

  fill(100);
  nearest_k.forEach(n=>{
    circle(n.point.x,n.point.y,2*r);
  })
  pop();

}
```

### 2D example

```javascript
let points = [
        {x: 0.5, y:0.5},
        {x: 0.1, y:0.3},
        {x: 1, y:0.1},
        {x: 0.75, y:2.5},
        {x: 0.7, y:1.2}
    ];

let tree = new KDTree(points, ['x','y']);

let query_point = {x:0.2,y:0.3};
let R = 0.2;
let ball = tree.nearest_within_R(query_point, R);
let nearest_k = tree.nearest_k(query_point, 3);
let nearest_neighbor = tree.nearest(query_point);
```

```javascript
> ball
[ // ordered by squared distance
    {
        point: {
            x: 0.1,
            y: 0.3,
            idx: 1
        },
        squared_distance: 0.01
    }
]
```

```javascript
> nearest_k
[ // ordered by squared distance
    {
        point: {
            x: 0.1,
            y: 0.3,
            idx: 1
        },
        squared_distance: 0.01
    },
    {
        point: {
            x: 0.5,
            y: 0.5,
            idx: 0
        },
        squared_distance: 0.13
    },
    {
        point: {
            x: 1,
            y: 0.1,
            idx: 2
        },
        squared_distance: 0.68
    }
]
```

```javascript
> nearest_neighbor
{
    point: {
        x: 0.1,
        y: 0.3,
        idx: 1
    },
    squared_distance: 0.01
}
```

### 3D example

```javascript
let points = [
        [ 0.5, 0.5, 0.6],
        [ 0.4, 0.2, 0.8],
        [ 0.1, 0.7, 0.1],
        [ 0.3, 0.7, 0.2]
    ];

let tree = new KDTree(points, [0,1,2]);
let nearest_neighbor = tree.nearest([0.5,0.5,0.5]);
console.log(nearest_neighbor);
```

Console:
```javascript
{
    point: {
        0: 0.5,
        1: 0.5,
        2: 0.6,
        idx: 0
    },
    squared_distance: 0.01
}
```

