class KDTree {
  
  constructor(points,dimensions,this_dim=0,is_root=true){
    
    let self = this;
    self.ndim = dimensions.length;
    self.dimensions = dimensions;
    
    // save the original index of points as an additional info
    if (is_root){
      points.forEach( (p, i) => {p.idx = i});
    }
    
    let pts, median, left, right;
    
    // in case there's more than one point to distribute,
    // split the points into left subspace, median, and right subspace,
    // according to the current dimension
    if (points.length>1){
      pts = points.slice();
      let split = self._split_at_median(pts,this_dim);
      median = split.median;
      left = split.left;
      right = split.right;
    } else {
      //otherwise, just save the single point for this node
      median = points[0];
      left = [];
      right = [];
    }
    
    self.point = median;
    
    // in case there's nodes left to put on the left side of the space,
    // do that, creating a new tree that will split the points along the next dimension
    if (left.length > 0)
      self.left = new KDTree(left,dimensions,(this_dim+1) % self.ndim, is_root=false);
    else
      self.left = null;
    
    // in case there's nodes left to put on the right side of the space,
    // do that, creating a new tree that will split the points along the next dimension
    if (right.length > 0)
      self.right = new KDTree(right,dimensions,(this_dim+1) % self.ndim, is_root=false);
    else
      self.right = null;
  }
  
  // find all points of the tree that lie within radius R of a query point.
  nearest_within_R(query_point, R, this_dim=0){
    
    const self = this;
    const ndim = self.ndim;
    const dims = self.dimensions;
    
    const R_squared = R**2;
    const squared_distance_to_point = this._dist2(self.point,query_point);
    const distance_to_hyperplane = query_point[dims[this_dim]] - self._get_hyperplane(this_dim);
    const squared_distance_to_hyperplane = distance_to_hyperplane**2;
    
    // check if the current point lies within the ball defined by R and
    // if yes, save it
    let ball = [];        
    if (squared_distance_to_point<=R_squared){
      ball.push({ 
                  point: self.point,
                  squared_distance: squared_distance_to_point
                });
    }
    
    let this_half, other_half;
    
    if (distance_to_hyperplane<0){
      this_half = self.left;
      other_half = self.right;
    } else {
      this_half = self.right;
      other_half = self.left;
    }
    
    // the query point lies within one of the subspaces this tree node potentially 
    // points to. Check this subspace for all possible points that lie within distance R
    if (this_half !== null){
      const deeper_ball = this_half.nearest_within_R(query_point, R, (this_dim+1) % self.ndim);
      ball = ball.concat(deeper_ball);
    }
    
    // if the hyperplane of the current tree node and the query point lie
    // farther apart than R, we can exclude the other subspace and do not need to search it.
    // If they cross, we need to search it.
    if ((squared_distance_to_hyperplane < R_squared) && (other_half !== null)){
      const deeper_ball = other_half.nearest_within_R(query_point, R, (this_dim+1) % self.ndim);
      ball = ball.concat(deeper_ball);
    }
    
    return ball;
  }
  
  // find the point that lies nearest to a query point
  nearest(query_point){
    return this.nearest_k(query_point,1)[0];
  }
  
  // find the k points that lie nearest to a query point
  nearest_k(query_point,k=1,neighs=[],this_dim=0){
    const self = this;
    const ndim = self.ndim;
    const dims = self.dimensions;
    
    const distance_to_hyperplane = query_point[dims[this_dim]] - self._get_hyperplane(this_dim);
   
    let this_half, other_half;
    
    if (distance_to_hyperplane<0){
      this_half = self.left;
      other_half = self.right;
    } else {
      this_half = self.right;
      other_half = self.left;
    }
    
    // first iterate all sections that query point lies in
    if (this_half !== null){
      neighs = this_half.nearest_k(query_point, k, neighs, (this_dim+1) % self.ndim);
    }
    
    // Then check if the current node is nearer than the furthest of the previously found nodes.
    // If yes, then add it. Also add it, if the number of potential neighbors hasn't
    // reached k yet.
    const squared_distance_to_point = this._dist2(self.point,query_point);
    if ((neighs.length<k) ||
        (squared_distance_to_point < neighs[k-1].squared_distance)
       )
    {
      neighs = self._insert_sorted(neighs,{
        point: self.point,
        squared_distance: squared_distance_to_point,
      })
    }

    // get rid of nodes that are too far away
    if (neighs.length>k)
      neighs = neighs.slice(0,k);

    // If the other section (the half of the space that the query point doesn't lie in)
    // is not null, check if the distance to the furthest of the previously found k
    // nodes crosses the hyperplane. If not, that means that there are no closer nodes
    // in the other half of the space. If yes, there might be other nodes in that half that
    // need to be checked. Also, if we haven't found k nodes yet, we need to check
    // that space.
    if (other_half !== null){
      let R_squared;
      if (neighs.length>0)
        R_squared = neighs[neighs.length-1].squared_distance;
      else
        R_squared = Infinity;

      if ((distance_to_hyperplane**2 < R_squared) || (neighs.length<k))
        neighs = other_half.nearest_k(query_point, k, neighs, (this_dim+1) % self.ndim);
    }

    // get rid of nodes that are too far away
    if (neighs.length>k)
      neighs = neighs.slice(0,k);
    
    return neighs;
  }
  
  // obtain the value of the hyperplane determined by the
  // integer dimension `this_dim`
  _get_hyperplane(this_dim){
    return this.point[
              this.dimensions[this_dim]
          ];
  }
  
  // sort an array according to an integer dimension `dim`,
  // identify a median, and split the array in to an array `left`
  // that contains all elements lower than the median, an array `right`
  // that contains all elements higher than the median, and
  // a value `median` that contains the median
  _split_at_median(points,dim){
    dim = this.dimensions[dim];
    let pts = points.sort((a, b) => a[dim]-b[dim] );
    let middle = Math.floor(pts.length / 2);
    let median = pts[middle];
    let left = pts.slice(0,middle); 
    let right = pts.slice(middle+1); 
    return {
      left: left,
      median: median,
      right: right
    };
  }
  
  // compute the squared distance between two points
  _dist2(a,b){
    let dist2 = 0;
    for(let i=0; i<this.ndim; i++){
      let dim = this.dimensions[i];
      dist2 += (a[dim]-b[dim])**2;
    }
    return dist2;
  }
  
  // insert a point for which the squared distance has already
  // been computed into a sorted array of other such points, such that
  // the resulting array is still sorted.
  _insert_sorted(arr, val) {
    let lo = 0,
        hi = arr.length;

    // binary search of index where to insert the value
    while (lo < hi)
    {
        let md = (lo + hi) >>> 1;
        if (arr[md].squared_distance < val.squared_distance)
          lo = md + 1;
        else
          hi = md;
    }
    // insert the value
    arr.splice(lo,0,val);
    return arr;
  }

}
