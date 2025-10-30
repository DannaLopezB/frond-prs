import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { SidemenuComponent } from '../common/sidemenu/sidemenu.component';

@Component({
  selector: 'app-components',
  standalone: true,
  imports: [RouterModule, SidemenuComponent, NavbarComponent],
  templateUrl: './components.component.html',
})
export class ComponentsComponent {

}
