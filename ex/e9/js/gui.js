


/* dat-gui setup */

window.onload = function()
{
    window.layers = '';
    this.gui = new dat.GUI();
    this.gui.add(window, 'layers', { None: '', Depth: '_depth', Normals: '_normals' } );
};/*end dat-gui setup*/