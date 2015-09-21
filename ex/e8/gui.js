/* dat-gui setup */

window.onload = function()
{

    this.gui = new dat.GUI();

    this.gui.add(window, 'grid');
    this.gui.add(window, 'i_refl', 0, 1);
    this.gui.add(window, 'gamma',0);
    this.gui.add(window, 'Mode', { Mesh: 0, Shaded: 1, Texturized: 2 } );

    var f1 = this.gui.addFolder('Light');
    f1.add(window.light, 'x');
    f1.add(window.light, 'y');
    f1.add(window.light, 'z');
    f1.addColor(window, 'color');

};/*end dat-gui setup*/