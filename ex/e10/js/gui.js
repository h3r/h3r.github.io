
/* dat-gui setup */
window.onload = function()
{

    this.gui = new dat.GUI();
    this.gui.add($custom, 'blur', 0, 10);

    //this.gui.add(window, 'layers', { None: '', Depth: '_depth', Normals: '_normals', Position: '_position'} );
};/*end dat-gui setup*/