import { Component, OnInit } from '@angular/core';
import { AboutService } from '../about.service';

export interface About {
  id?: number;
  mission: string;
  vision: string;
  story: string;
  valueText: string;
}

@Component({
  selector: 'app-about',
  standalone: false,
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {

  aboutList: About[] = [];
  formAbout: About = { mission: '', vision: '', story: '', valueText: '' };
  editingAbout: About | null = null;

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.loadAbouts();
  }

  loadAbouts() {
    this.aboutService.getAll().subscribe(data => {
      this.aboutList = data;
    });
  }

 saveAbout() {
  if (!this.formAbout.mission.trim() || !this.formAbout.vision.trim() ||
      !this.formAbout.story.trim() || !this.formAbout.valueText.trim()) {
    alert('Please fill in all fields before saving.');
    return;
  }

  if (this.editingAbout) {
    // PUT
    this.aboutService.update(this.editingAbout.id!, this.formAbout).subscribe(() => {
      this.editingAbout = null;
      this.resetForm();
      this.loadAbouts();
    });
  } else {
    // POST
    this.aboutService.create(this.formAbout).subscribe(() => {
      this.resetForm();
      this.loadAbouts();
    });
  }
}

  editAbout(about: About) {
    this.editingAbout = about;
    this.formAbout = { ...about };
  }

  deleteAbout(id: number) {
    if (confirm('Are you sure you want to delete this About section?')) {
      this.aboutService.delete(id).subscribe(() => this.loadAbouts());
    }
  }

  cancelEdit() {
    this.editingAbout = null;
    this.resetForm();
  }

  resetForm() {
    this.formAbout = { mission: '', vision: '', story: '', valueText: '' };
  }
}
